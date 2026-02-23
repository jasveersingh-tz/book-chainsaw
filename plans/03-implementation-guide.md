# Implementation Guide: Step-by-Step

## 🎯 Phase-by-Phase Implementation Plan

This guide outlines exactly how to **extract the PR review automation scripts** from the `book-chainsaw` repository into a separate, standalone npm package.

**⚠️ Strategy:**

- Create **NEW repository** `pr-guardian` for the package
- Extract analyzers from `book-chainsaw/scripts/ai-review/`
- Keep `book-chainsaw` as demo/testing project
- Update `book-chainsaw` to consume the published package

---

## Phase 1: Package Creation & Extraction (Week 1)

### Step 1.1: Create New Package Repository

```bash
# Create SEPARATE repository for the package
mkdir pr-guardian
cd pr-guardian
git init
npm init -y
```

**⚠️ Two Repositories:**

1. `book-chainsaw/` - Demo Angular app (stays intact)
2. `pr-guardian/` - New npm package (extracted automation)

### Step 1.2: Setup Package Structure

```bash
# Target structure for NEW pr-guardian repository
pr-guardian/
├── package.json
├── README.md
├── LICENSE
├── bin/
│   └── pr-guardian.js           # CLI entry point
├── src/
│   ├── analyzers/                # EXTRACTED from book-chainsaw
│   │   ├── code-analyzer.ts     # FROM: scripts/ai-review/code-analyzer.js
│   │   ├── security-scanner.ts  # FROM: scripts/ai-review/security-scanner.js
│   │   ├── coverage-analyzer.ts # FROM: scripts/ai-review/coverage-analyzer.js
│   │   └── pr-analyzer.ts       # FROM: scripts/ai-review/pr-analyzer.js
│   ├── reporters/
│   │   ├── github-reporter.ts   # EXTRACTED from workflow
│   │   ├── console-reporter.ts
│   │   └── json-reporter.ts
│   ├── core/
│   │   ├── scorer.ts            # EXTRACTED from workflow
│   │   └── config-loader.ts
│   └── index.ts
├── tests/
└── templates/
    └── github-workflow.yml
```

### Step 1.3: Extract Analyzers from book-chainsaw

Refactor existing analyzers to be reusable:

```javascript
// packages/pr-guardian/src/analyzers/BaseAnalyzer.js
class BaseAnalyzer {
  constructor(config = {}) {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    };
    this.issues = [];
  }

  getDefaultConfig() {
    return {};
  }

  async analyze(context) {
    throw new Error('analyze() must be implemented by subclass');
  }

  addIssue(severity, category, message, details = {}) {
    this.issues.push({
      severity,
      category,
      message,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  getIssues() {
    return this.issues;
  }

  reset() {
    this.issues = [];
  }
}

module.exports = BaseAnalyzer;
```

```javascript
// packages/pr-guardian/src/analyzers/CodeQualityAnalyzer.js
const BaseAnalyzer = require('./BaseAnalyzer');

class CodeQualityAnalyzer extends BaseAnalyzer {
  getDefaultConfig() {
    return {
      maxComplexity: 15,
      noAnyType: true,
      requireReturnTypes: true,
      maxFunctionLength: 50,
    };
  }

  async analyze(context) {
    const { files, options } = context;

    for (const file of files) {
      await this.analyzeFile(file);
    }

    return {
      score: this.calculateScore(),
      issues: this.getIssues(),
      metrics: this.getMetrics(),
    };
  }

  async analyzeFile(file) {
    const content = await this.readFile(file.path);

    // Run checks
    this.checkTypeScript(file, content);
    this.checkComplexity(file, content);
    this.checkCodeSmells(file, content);
    this.checkBestPractices(file, content);
  }

  // ... rest of implementation
}

module.exports = CodeQualityAnalyzer;
```

---

## Phase 2: Implement Dependency Graph (Week 2)

### Step 2.1: Install Required Dependencies

```bash
cd packages/pr-guardian
npm init -y
npm install --save \
  @typescript-eslint/parser \
  @typescript-eslint/typescript-estree \
  acorn \
  acorn-walk \
  dependency-graph
```

### Step 2.2: Build Dependency Graph Analyzer

```javascript
// packages/pr-guardian/src/analyzers/DependencyGraphAnalyzer.js
const ts = require('@typescript-eslint/typescript-estree');
const fs = require('fs').promises;
const path = require('path');
const { DepGraph } = require('dependency-graph');

class DependencyGraphAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.graph = new DepGraph();
    this.fileContents = new Map();
    this.exports = new Map(); // file -> exported symbols
    this.imports = new Map(); // file -> imported symbols
  }

  async buildGraph(files) {
    // Phase 1: Parse all files and extract imports/exports
    for (const file of files) {
      await this.parseFile(file);
    }

    // Phase 2: Build dependency relationships
    this.buildDependencyRelations();

    return this.graph;
  }

  async parseFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    this.fileContents.set(filePath, content);

    try {
      const ast = ts.parse(content, {
        loc: true,
        range: true,
        tokens: true,
        comment: true,
        jsx: false,
      });

      // Extract imports
      const imports = this.extractImports(ast);
      this.imports.set(filePath, imports);

      // Extract exports
      const exports = this.extractExports(ast);
      this.exports.set(filePath, exports);

      // Add to graph
      this.graph.addNode(filePath);
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
    }
  }

  extractImports(ast) {
    const imports = [];

    const visit = (node) => {
      // Import declarations: import { X } from 'Y'
      if (node.type === 'ImportDeclaration') {
        imports.push({
          source: node.source.value,
          specifiers: node.specifiers.map((spec) => ({
            imported: spec.imported?.name || 'default',
            local: spec.local.name,
          })),
          type: 'static',
        });
      }

      // Dynamic imports: import('Y')
      if (node.type === 'ImportExpression') {
        imports.push({
          source: node.source.value,
          type: 'dynamic',
        });
      }

      // Require: require('Y')
      if (node.type === 'CallExpression' && node.callee.name === 'require') {
        imports.push({
          source: node.arguments[0].value,
          type: 'require',
        });
      }

      // Recursively visit child nodes
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(visit);
          } else {
            visit(node[key]);
          }
        }
      }
    };

    visit(ast);
    return imports;
  }

  extractExports(ast) {
    const exports = {
      named: [],
      default: null,
      all: [],
    };

    const visit = (node) => {
      // Named exports: export const X
      if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
          exports.named.push(...this.extractDeclarationNames(node.declaration));
        }
        if (node.specifiers) {
          exports.named.push(...node.specifiers.map((s) => s.exported.name));
        }
      }

      // Default export: export default X
      if (node.type === 'ExportDefaultDeclaration') {
        exports.default = this.extractDefaultExport(node.declaration);
      }

      // Export all: export * from 'Y'
      if (node.type === 'ExportAllDeclaration') {
        exports.all.push(node.source.value);
      }

      // Recursively visit
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(visit);
          } else {
            visit(node[key]);
          }
        }
      }
    };

    visit(ast);
    return exports;
  }

  extractDeclarationNames(declaration) {
    const names = [];

    if (declaration.type === 'VariableDeclaration') {
      declaration.declarations.forEach((decl) => {
        names.push(decl.id.name);
      });
    } else if (
      declaration.type === 'FunctionDeclaration' ||
      declaration.type === 'ClassDeclaration'
    ) {
      names.push(declaration.id.name);
    }

    return names;
  }

  buildDependencyRelations() {
    for (const [file, imports] of this.imports) {
      for (const imp of imports) {
        const resolvedPath = this.resolveImportPath(file, imp.source);

        if (resolvedPath && this.graph.hasNode(resolvedPath)) {
          try {
            this.graph.addDependency(file, resolvedPath);
          } catch (error) {
            // Circular dependency detected - we'll handle this separately
          }
        }
      }
    }
  }

  resolveImportPath(fromFile, importPath) {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.resolve(dir, importPath);

      // Try with extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (this.fileContents.has(withExt)) {
          return withExt;
        }
      }

      // Try index files
      for (const ext of extensions) {
        const indexPath = path.join(resolved, 'index' + ext);
        if (this.fileContents.has(indexPath)) {
          return indexPath;
        }
      }
    }

    // Handle absolute imports (node_modules) - not tracked in graph
    return null;
  }

  getDependents(file) {
    return this.graph.dependantsOf(file);
  }

  getDependencies(file) {
    return this.graph.dependenciesOf(file);
  }

  getCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const detectCycle = (node, path = []) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const dependencies = this.graph.dependenciesOf(node);

      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          detectCycle(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // Cycle detected
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart);
          cycle.push(dep);
          cycles.push(cycle);
        }
      }

      recursionStack.delete(node);
    };

    for (const node of this.graph.nodes()) {
      if (!visited.has(node)) {
        detectCycle(node);
      }
    }

    return cycles;
  }
}

module.exports = DependencyGraphAnalyzer;
```

### Step 2.3: Implement Impact Analyzer

```javascript
// packages/pr-guardian/src/analyzers/ImpactAnalyzer.js
const DependencyGraphAnalyzer = require('./DependencyGraphAnalyzer');
const BaseAnalyzer = require('./BaseAnalyzer');

class ImpactAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.graphAnalyzer = null;
  }

  async analyze(context) {
    const { changedFiles, allFiles, baseCommit, headCommit } = context;

    // Build dependency graph
    this.graphAnalyzer = new DependencyGraphAnalyzer(context.projectRoot);
    await this.graphAnalyzer.buildGraph(allFiles);

    const impacts = [];

    for (const file of changedFiles) {
      const impact = await this.analyzeFileImpact(file, baseCommit, headCommit);
      if (impact) {
        impacts.push(impact);
      }
    }

    return {
      impacts,
      issues: this.getIssues(),
      circularDependencies: this.graphAnalyzer.getCircularDependencies(),
    };
  }

  async analyzeFileImpact(file, baseCommit, headCommit) {
    // Get file at both commits
    const oldContent = await this.getFileAtCommit(file, baseCommit);
    const newContent = await this.getFileAtCommit(file, headCommit);

    if (!oldContent || !newContent) return null;

    // Detect API changes
    const apiChanges = await this.detectAPIChanges(oldContent, newContent);

    if (apiChanges.length === 0) return null;

    // Get all dependents
    const directDependents = this.graphAnalyzer.getDependents(file);
    const allDependents = this.getAllDependents(file);

    // Calculate severity
    const severity = this.calculateImpactSeverity(apiChanges, allDependents.length);

    // Add issues for breaking changes
    const breakingChanges = apiChanges.filter((c) => c.breaking);
    if (breakingChanges.length > 0) {
      this.addIssue(
        'error',
        'Breaking Change',
        `${file} has ${breakingChanges.length} breaking change(s) affecting ${allDependents.length} file(s)`,
        {
          file,
          changes: breakingChanges,
          affectedFiles: allDependents,
        },
      );
    }

    return {
      file,
      apiChanges,
      directDependents: directDependents.length,
      totalDependents: allDependents.length,
      affectedFiles: allDependents,
      severity,
      breakingChanges: breakingChanges.length,
    };
  }

  async detectAPIChanges(oldContent, newContent) {
    // Parse both versions
    const oldExports = this.parseExports(oldContent);
    const newExports = this.parseExports(newContent);

    const changes = [];

    // Detect removed exports (BREAKING)
    for (const [name, oldSig] of Object.entries(oldExports)) {
      if (!newExports[name]) {
        changes.push({
          type: 'REMOVED',
          name,
          severity: 'CRITICAL',
          breaking: true,
          oldSignature: oldSig,
        });
      }
    }

    // Detect modified exports
    for (const [name, newSig] of Object.entries(newExports)) {
      const oldSig = oldExports[name];

      if (oldSig && !this.signaturesEqual(oldSig, newSig)) {
        const isBreaking = this.isBreakingChange(oldSig, newSig);

        changes.push({
          type: 'MODIFIED',
          name,
          severity: isBreaking ? 'HIGH' : 'MEDIUM',
          breaking: isBreaking,
          oldSignature: oldSig,
          newSignature: newSig,
          details: this.compareSignatures(oldSig, newSig),
        });
      }
    }

    // Detect added exports (SAFE)
    for (const [name, newSig] of Object.entries(newExports)) {
      if (!oldExports[name]) {
        changes.push({
          type: 'ADDED',
          name,
          severity: 'INFO',
          breaking: false,
          newSignature: newSig,
        });
      }
    }

    return changes;
  }

  getAllDependents(file, visited = new Set()) {
    if (visited.has(file)) return [];
    visited.add(file);

    const direct = this.graphAnalyzer.getDependents(file);
    const transitive = direct.flatMap((dep) => this.getAllDependents(dep, visited));

    return [...new Set([...direct, ...transitive])];
  }

  calculateImpactSeverity(changes, dependentCount) {
    const breakingCount = changes.filter((c) => c.breaking).length;

    if (breakingCount > 0 && dependentCount > 10) return 'CRITICAL';
    if (breakingCount > 0 && dependentCount > 0) return 'HIGH';
    if (changes.length > 5) return 'MEDIUM';

    return 'LOW';
  }
}

module.exports = ImpactAnalyzer;
```

---

## Phase 3: Build CLI & Configuration (Week 3)

### Step 3.1: Create CLI

```javascript
// packages/pr-guardian/bin/pr-guardian.js
#!/usr/bin/env node

const { Command } = require('commander');
const PRGuardian = require('../src/core/PRGuardian');
const ConfigLoader = require('../src/config/ConfigLoader');

const program = new Command();

program
  .name('pr-guardian')
  .description('Bulletproof PR review automation')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze changed files in PR')
  .option('-c, --config <path>', 'Config file path', '.pr-guardian.config.js')
  .option('-f, --files <pattern>', 'File pattern to analyze')
  .option('--base <ref>', 'Base branch/commit', 'main')
  .option('--head <ref>', 'Head branch/commit', 'HEAD')
  .option('--format <type>', 'Output format (json|console)', 'console')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load(options.config);
      const guardian = new PRGuardian(config);

      const results = await guardian.analyze({
        baseBranch: options.base,
        headBranch: options.head,
        filePattern: options.files
      });

      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        guardian.report(results, { format: 'console' });
      }

      // Exit with error code if critical issues
      if (results.score < config.thresholds.minimumScore) {
        process.exit(1);
      }

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize PR Guardian configuration')
  .action(async () => {
    const ConfigGenerator = require('../src/config/ConfigGenerator');
    await ConfigGenerator.generate(process.cwd());
    console.log('✅ Created .pr-guardian.config.js');
  });

program
  .command('impact')
  .description('Analyze impact of changes')
  .option('--base <ref>', 'Base branch/commit', 'main')
  .option('--head <ref>', 'Head branch/commit', 'HEAD')
  .action(async (options) => {
    const config = await ConfigLoader.load();
    const guardian = new PRGuardian(config);

    const impact = await guardian.analyzeImpact({
      baseBranch: options.base,
      headBranch: options.head
    });

    console.log(JSON.stringify(impact, null, 2));
  });

program.parse();
```

### Step 3.2: Configuration Loader

```javascript
// packages/pr-guardian/src/config/ConfigLoader.js
const path = require('path');
const fs = require('fs').promises;

class ConfigLoader {
  static async load(configPath = '.pr-guardian.config.js') {
    const fullPath = path.resolve(process.cwd(), configPath);

    try {
      // Check if file exists
      await fs.access(fullPath);

      // Load config
      const config = require(fullPath);

      // Merge with defaults
      return this.mergeWithDefaults(config);
    } catch (error) {
      console.warn(`Config file not found at ${fullPath}, using defaults`);
      return this.getDefaultConfig();
    }
  }

  static getDefaultConfig() {
    return {
      framework: 'auto-detect',
      thresholds: {
        minimumScore: 85,
        failOnCritical: true,
        weights: {
          codeQuality: 0.5,
          security: 0.3,
          prMetadata: 0.2,
        },
      },
      files: {
        include: ['src/**/*.ts', 'src/**/*.js'],
        exclude: ['**/*.spec.ts', '**/*.test.ts', 'node_modules/**'],
      },
      analyzers: {
        code: { enabled: true },
        security: { enabled: true },
        impact: { enabled: true },
        dependencies: { enabled: true },
      },
      pr: {
        titlePattern: '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\\(.+\\))?!?: .+',
        descriptionMinLength: 50,
      },
      reporters: ['console'],
    };
  }

  static mergeWithDefaults(config) {
    const defaults = this.getDefaultConfig();

    return {
      ...defaults,
      ...config,
      thresholds: { ...defaults.thresholds, ...config.thresholds },
      files: { ...defaults.files, ...config.files },
      analyzers: { ...defaults.analyzers, ...config.analyzers },
      pr: { ...defaults.pr, ...config.pr },
    };
  }
}

module.exports = ConfigLoader;
```

---

## Phase 4: Testing & Documentation (Week 4)

### Step 4.1: Comprehensive Tests

```javascript
// packages/pr-guardian/tests/DependencyGraphAnalyzer.test.js
const DependencyGraphAnalyzer = require('../src/analyzers/DependencyGraphAnalyzer');
const path = require('path');

describe('DependencyGraphAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new DependencyGraphAnalyzer(path.join(__dirname, 'fixtures'));
  });

  test('should build dependency graph', async () => {
    const files = ['fixtures/fileA.ts', 'fixtures/fileB.ts', 'fixtures/fileC.ts'];

    await analyzer.buildGraph(files);

    expect(analyzer.graph.size()).toBe(3);
  });

  test('should detect circular dependencies', async () => {
    const files = ['fixtures/circular/a.ts', 'fixtures/circular/b.ts', 'fixtures/circular/c.ts'];

    await analyzer.buildGraph(files);
    const cycles = analyzer.getCircularDependencies();

    expect(cycles.length).toBeGreaterThan(0);
  });

  test('should find all dependents', async () => {
    await analyzer.buildGraph(['fixtures/fileA.ts', 'fixtures/fileB.ts']);

    const dependents = analyzer.getDependents('fixtures/fileA.ts');

    expect(dependents).toContain('fixtures/fileB.ts');
  });
});
```

---

## Phase 5: Package Publishing (Week 5)

### Step 5.1: Prepare for NPM

```json
// packages/pr-guardian/package.json
{
  "name": "@your-org/pr-guardian",
  "version": "1.0.0",
  "description": "Bulletproof automated PR review system",
  "main": "src/index.js",
  "bin": {
    "pr-guardian": "./bin/pr-guardian.js"
  },
  "scripts": {
    "test": "jest",
    "lint": "eslint src/",
    "prepublishOnly": "npm test && npm run lint"
  },
  "keywords": ["pr", "code-review", "automation", "ci-cd", "static-analysis"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/pr-guardian"
  },
  "dependencies": {
    "@typescript-eslint/parser": "^6.0.0",
    "commander": "^11.0.0",
    "dependency-graph": "^0.11.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

### Step 5.2: Publish

```bash
# Login to npm
npm login

# Publish package
cd packages/pr-guardian
npm publish --access public
```

---

## 📊 Progress Tracking

Use this checklist to track implementation:

### Week 1: Foundation

- [ ] Create package structure
- [ ] Extract and refactor analyzers
- [ ] Setup TypeScript
- [ ] Add testing framework
- [ ] Basic CLI structure

### Week 2: Impact Analysis

- [ ] Dependency graph builder
- [ ] Import/Export parser
- [ ] Impact analyzer
- [ ] Circular dependency detector
- [ ] API change detector

### Week 3: Advanced Features

- [ ] Call graph analyzer
- [ ] State mutation tracker
- [ ] Integration point validator
- [ ] Contract verifier
- [ ] Performance analyzer

### Week 4: Polish

- [ ] Comprehensive tests (>80% coverage)
- [ ] Documentation (README, API docs)
- [ ] Example configurations
- [ ] GitHub Actions template
- [ ] Migration guide

### Week 5: Release

- [ ] Final testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Publish to npm
- [ ] Announcement

---

**Ready to start?** Begin with Phase 1, Step 1.1!
