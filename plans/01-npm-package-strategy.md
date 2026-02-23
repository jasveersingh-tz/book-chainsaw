# NPM Package Strategy: AI-Powered PR Review System

## 📦 Package Vision

Extract **only the PR automation/review system** (from `scripts/ai-review/` and `.github/workflows/`) into a **reusable, installable npm package** that any team can add to their repository for bulletproof automated PR reviews.

**⚠️ IMPORTANT SCOPE:**

- ✅ **Package:** PR automation scripts, analyzers, reporters, scoring engine
- ❌ **NOT packaged:** The Angular library management application in `src/`
- 📦 **Angular app:** Remains in repo as demo/testing environment for the package

---

## 🎯 Package Name (Proposed)

```
@your-org/pr-guardian
```

**Alternative Names:**

- `pr-shield`
- `code-sentinel`
- `pr-fortress`
- `review-guardian`
- `pr-watchdog`

---

## 📋 Package Structure

### Core Package Contents

**Source:** Extracted from `scripts/ai-review/` + refactored workflow logic

```
pr-guardian/
├── package.json
├── README.md
├── LICENSE
├── bin/
│   └── pr-guardian.js           # CLI entry point
├── lib/
│   ├── analyzers/                # EXTRACTED from scripts/ai-review/
│   │   ├── code-analyzer.js     # FROM: scripts/ai-review/code-analyzer.js
│   │   ├── security-scanner.js  # FROM: scripts/ai-review/security-scanner.js
│   │   ├── coverage-analyzer.js # FROM: scripts/ai-review/coverage-analyzer.js
│   │   ├── pr-analyzer.js       # FROM: scripts/ai-review/pr-analyzer.js
│   │   ├── dependency-analyzer.js # NEW: Dependency impact analysis
│   │   └── impact-analyzer.js   # NEW: Cross-feature impact detection
│   ├── reporters/
│   │   ├── github-reporter.js   # EXTRACTED from workflow comment logic
│   │   ├── console-reporter.js  # CLI output
│   │   └── json-reporter.js     # JSON output for CI/CD
│   ├── rules/
│   │   ├── typescript-rules.js  # TypeScript-specific checks
│   │   ├── angular-rules.js     # Angular best practices (framework detection)
│   │   ├── react-rules.js       # React patterns (future)
│   │   └── custom-rules.js      # User-defined rules
│   ├── config/
│   │   ├── default-config.js    # Default settings
│   │   └── config-loader.js     # Load user config
│   └── core/
│       ├── scorer.js            # EXTRACTED from workflow scoring logic
│       ├── rule-engine.js       # Rule execution framework
│       └── plugin-manager.js    # Plugin system
├── templates/
│   └── github-workflow.yml      # Simplified template for users
├── plugins/                      # Plugin architecture
│   ├── plugin-interface.js
│   └── example-plugin.js
└── tests/
    └── ... (comprehensive test suite)
```

**Original Repo After Extraction:**

```
book-chainsaw/                    # DEMO/TESTING PROJECT
├── src/                          # Angular app (UNCHANGED)
├── scripts/ai-review/            # MARKED AS: Use @your-org/pr-guardian instead
├── .github/workflows/
│   └── ai-code-review.yml       # UPDATED to use published package
├── .pr-guardian.config.js       # NEW: Configuration for package
└── README.md                     # UPDATED: "Demo app for pr-guardian"
```

---

## 🚀 Usage Scenarios

### 1. NPM Package Installation

```bash
npm install --save-dev @your-org/pr-guardian
```

### 2. Configuration File

**`.pr-guardian.config.js`** in project root:

```javascript
module.exports = {
  // Framework detection
  framework: 'angular', // 'react', 'vue', 'node', 'auto-detect'

  // Score thresholds
  thresholds: {
    minimumScore: 85,
    failOnCritical: true,
    weights: {
      codeQuality: 0.5,
      security: 0.3,
      prMetadata: 0.2,
    },
  },

  // File patterns
  files: {
    include: ['src/**/*.ts', 'src/**/*.js'],
    exclude: ['**/*.spec.ts', '**/*.test.ts', 'node_modules/**'],
  },

  // Analyzers configuration
  analyzers: {
    code: {
      enabled: true,
      rules: {
        noAnyType: 'error',
        explicitReturnTypes: 'warning',
        maxComplexity: 15,
      },
    },
    security: {
      enabled: true,
      auditLevel: 'moderate', // 'low', 'moderate', 'high', 'critical'
      checkPatterns: true,
    },
    impact: {
      enabled: true, // NEW: Cross-feature impact analysis
      detectBreakingChanges: true,
      analyzeImports: true,
      trackPublicAPI: true,
    },
    dependencies: {
      enabled: true, // NEW: Dependency impact
      checkLockfileChanges: true,
      validateVersions: true,
      detectCircularDeps: true,
    },
  },

  // PR validation rules
  pr: {
    titlePattern:
      '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?!?: .+',
    descriptionMinLength: 50,
    requireLinkedIssue: false,
    branchPattern: '^(feature|bugfix|hotfix|chore|refactor)/[a-z0-9-]+$',
  },

  // Plugins
  plugins: [
    '@pr-guardian/plugin-bundle-size',
    '@pr-guardian/plugin-accessibility',
    './custom-plugins/my-custom-checker.js',
  ],

  // Reporting
  reporters: ['github', 'console'],

  // Custom rules
  customRules: [
    {
      name: 'no-console-in-production',
      pattern: /console\.(log|warn|error)/g,
      severity: 'error',
      message: 'Console statements not allowed in production code',
      filePattern: 'src/**/*.ts',
    },
  ],
};
```

### 3. CLI Usage

```bash
# Analyze current PR
npx pr-guardian analyze

# Analyze specific files
npx pr-guardian analyze --files "src/**/*.ts"

# Initialize configuration
npx pr-guardian init

# Run with custom config
npx pr-guardian analyze --config custom-config.js

# Output as JSON
npx pr-guardian analyze --format json > results.json

# Check impact analysis only
npx pr-guardian impact --base main --head feature-branch
```

### 4. GitHub Actions Integration

```yaml
name: PR Guardian Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run PR Guardian
        uses: your-org/pr-guardian-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          config-path: .pr-guardian.config.js
          fail-on-low-score: true
```

### 5. Programmatic API

```javascript
const { PRGuardian } = require('@your-org/pr-guardian');

const guardian = new PRGuardian({
  configPath: '.pr-guardian.config.js',
});

// Analyze PR
const results = await guardian.analyze({
  baseBranch: 'main',
  headBranch: 'feature/new-feature',
  changedFiles: ['src/app.ts', 'src/utils.ts'],
});

console.log(results.score); // 92
console.log(results.issues); // Array of issues
console.log(results.recommendation); // 'APPROVE' or 'REQUEST_CHANGES'

// Post to GitHub
await guardian.report(results, {
  owner: 'your-org',
  repo: 'your-repo',
  prNumber: 123,
});
```

---

## 🔐 Bulletproof Features Required

### Phase 1: Core Protection (Current State Enhanced)

#### 1. **Code Quality Analyzer** (Enhanced)

- ✅ Type safety validation
- ✅ Complexity analysis (cyclomatic, cognitive)
- ✅ Code smell detection
- ✅ Best practices enforcement
- 🆕 **Dead code detection**
- 🆕 **Unused imports/variables**
- 🆕 **Duplicate code detection**
- 🆕 **API surface area changes**

#### 2. **Security Scanner** (Enhanced)

- ✅ NPM audit integration
- ✅ Dangerous pattern detection
- 🆕 **Secrets detection** (API keys, tokens, passwords)
- 🆕 **SQL injection patterns**
- 🆕 **XSS vulnerability patterns**
- 🆕 **CSRF detection**
- 🆕 **Dependency vulnerability tracking**
- 🆕 **License compliance checking**

#### 3. **PR Metadata Validator** (Enhanced)

- ✅ Title format validation
- ✅ Description quality checks
- ✅ Branch naming conventions
- 🆕 **Linked issue requirement**
- 🆕 **Breaking change declaration**
- 🆕 **Changelog update verification**
- 🆕 **Documentation update checks**

### Phase 2: Impact Analysis (NEW - Critical for Bulletproof)

#### 4. **Cross-Feature Impact Analyzer** 🚨 **CRITICAL**

**Purpose:** Detect if changes might break other features

```javascript
// Example implementation
class ImpactAnalyzer {
  async analyzeImpact(changedFiles, baseCommit, headCommit) {
    return {
      // Direct impacts
      modifiedPublicAPIs: [
        {
          file: 'src/services/user.service.ts',
          api: 'getUserById',
          changes: ['parameter type changed', 'return type modified'],
          risk: 'HIGH',
          potentiallyAffected: ['src/components/user-profile.ts', 'src/components/admin-panel.ts'],
        },
      ],

      // Indirect impacts
      dependencyChanges: [
        {
          file: 'src/utils/validation.ts',
          importedBy: 15, // files that import this
          changeType: 'signature-modified',
          risk: 'MEDIUM',
        },
      ],

      // Breaking changes
      breakingChanges: [
        {
          type: 'REMOVED_EXPORT',
          item: 'deprecated function removeUser',
          file: 'src/services/user.service.ts',
          usages: [], // No longer used, safe to remove
        },
      ],

      // Architectural impacts
      architecturalChanges: [
        {
          type: 'NEW_DEPENDENCY',
          from: 'feature-a',
          to: 'feature-b',
          creates: 'CIRCULAR_DEPENDENCY',
          severity: 'ERROR',
        },
      ],
    };
  }
}
```

**Detection Methods:**

- 🔍 Static analysis of import/export changes
- 🔍 Function signature modifications
- 🔍 Interface/type changes
- 🔍 Module dependency graph analysis
- 🔍 Public API surface comparison
- 🔍 Component prop changes (React/Angular)
- 🔍 Service method signature changes
- 🔍 Database schema changes (if applicable)

#### 5. **Dependency Impact Analyzer** 🚨 **CRITICAL**

```javascript
class DependencyAnalyzer {
  async analyzeDependencies(packageJsonDiff, lockfileDiff) {
    return {
      // Version changes
      versionChanges: [
        {
          package: 'lodash',
          from: '4.17.20',
          to: '4.17.21',
          type: 'PATCH',
          risk: 'LOW',
          breaking: false,
        },
        {
          package: 'angular',
          from: '17.0.0',
          to: '18.0.0',
          type: 'MAJOR',
          risk: 'HIGH',
          breaking: true,
          migration: 'REQUIRED',
        },
      ],

      // New dependencies
      newDependencies: [
        {
          name: 'axios',
          version: '1.6.0',
          size: '1.2MB',
          vulnerabilities: 0,
          licenses: ['MIT'],
          transitiveDeps: 5,
        },
      ],

      // Removed dependencies
      removedDependencies: [
        {
          name: 'moment',
          stillUsedIn: ['src/utils/date.ts'], // ERROR!
          risk: 'CRITICAL',
        },
      ],

      // Circular dependencies
      circularDependencies: [
        {
          cycle: ['moduleA', 'moduleB', 'moduleC', 'moduleA'],
          severity: 'ERROR',
        },
      ],

      // Bundle impact
      bundleImpact: {
        sizeDelta: '+125KB',
        percentIncrease: 12.5,
        threshold: 100, // KB
        exceeds: true,
      },
    };
  }
}
```

#### 6. **Test Impact Analyzer** 🚨 **CRITICAL**

```javascript
class TestImpactAnalyzer {
  async analyzeTestCoverage(changedFiles) {
    return {
      // Coverage for changed files
      changedFileCoverage: [
        {
          file: 'src/services/auth.service.ts',
          coverage: {
            statements: 45, // %
            branches: 30,
            functions: 50,
            lines: 45,
          },
          threshold: 80,
          passes: false,
          missingTests: ['login error handling', 'token expiration logic'],
        },
      ],

      // Test file existence
      missingTestFiles: [
        {
          sourceFile: 'src/components/new-feature.ts',
          expectedTestFile: 'src/components/new-feature.spec.ts',
          exists: false,
        },
      ],

      // Breaking test changes
      testModifications: [
        {
          testFile: 'src/services/user.service.spec.ts',
          type: 'DISABLED_TESTS',
          disabled: ['should validate email'],
          reason: 'Tests commented out',
          risk: 'HIGH',
        },
      ],
    };
  }
}
```

#### 7. **Performance Impact Analyzer**

```javascript
class PerformanceAnalyzer {
  async analyzePerformance(changedFiles) {
    return {
      // Performance anti-patterns
      antiPatterns: [
        {
          file: 'src/components/list.ts',
          pattern: 'MISSING_TRACK_BY',
          line: 45,
          impact: 'Causes full DOM re-render on data changes',
          severity: 'WARNING',
        },
        {
          file: 'src/services/data.service.ts',
          pattern: 'UNSUBSCRIBED_OBSERVABLE',
          line: 78,
          impact: 'Memory leak',
          severity: 'ERROR',
        },
      ],

      // Bundle size changes
      bundleAnalysis: {
        before: '2.1MB',
        after: '2.4MB',
        delta: '+300KB',
        threshold: '200KB',
        exceeds: true,
        culprits: [{ file: 'new-heavy-library', size: '280KB' }],
      },

      // Runtime complexity
      complexityChanges: [
        {
          function: 'processLargeDataset',
          oldComplexity: 'O(n)',
          newComplexity: 'O(n²)',
          risk: 'HIGH',
          recommendation: 'Consider using Map/Set for lookups',
        },
      ],
    };
  }
}
```

### Phase 3: Advanced Protection

#### 8. **Regression Prevention**

- Compare with previous PR patterns
- Learn from past mistakes
- Track historical breaking changes
- Pattern recognition for common errors

#### 9. **AI-Powered Context Analysis**

- Understand code intent
- Detect logical errors
- Suggest better patterns
- Code review from LLM

#### 10. **Documentation Validator**

- API documentation completeness
- README updates for new features
- Changelog entries
- JSDoc/TSDoc coverage

---

## 🏗️ Architecture for Package

### Plugin System

```javascript
// Example plugin
class BundleSizePlugin {
  constructor(config) {
    this.maxSize = config.maxSize || 500; // KB
  }

  async analyze(context) {
    const bundleSize = await this.calculateBundleSize(context.files);

    if (bundleSize > this.maxSize) {
      return {
        severity: 'error',
        message: `Bundle size ${bundleSize}KB exceeds limit ${this.maxSize}KB`,
        file: 'bundle.js',
        category: 'Performance',
      };
    }

    return null;
  }
}

module.exports = BundleSizePlugin;
```

### Rule Engine

```javascript
class RuleEngine {
  constructor(rules) {
    this.rules = rules;
  }

  async execute(context) {
    const results = [];

    for (const rule of this.rules) {
      if (this.shouldExecute(rule, context)) {
        const result = await rule.execute(context);
        if (result) results.push(result);
      }
    }

    return results;
  }

  shouldExecute(rule, context) {
    // Check file patterns, conditions, etc.
    return rule.condition(context);
  }
}
```

---

## 📈 Implementation Roadmap

### Phase 1: Package Foundation (Weeks 1-2)

- [ ] Extract analyzer scripts to standalone modules
- [ ] Create package structure
- [ ] Implement config loader
- [ ] Build CLI interface
- [ ] Add basic reporters (console, JSON)
- [ ] Write comprehensive tests

### Phase 2: Impact Analysis (Weeks 3-4)

- [ ] Build dependency graph analyzer
- [ ] Implement cross-file impact detection
- [ ] Create breaking change detector
- [ ] Add circular dependency checker
- [ ] Bundle size impact analyzer

### Phase 3: Advanced Features (Weeks 5-6)

- [ ] Plugin system implementation
- [ ] AI integration for context analysis
- [ ] Performance impact detection
- [ ] Regression prevention system
- [ ] Historical pattern learning

### Phase 4: Polish & Publish (Week 7)

- [ ] Comprehensive documentation
- [ ] Example projects
- [ ] GitHub Actions template
- [ ] NPM package publishing
- [ ] Version 1.0.0 release

---

## 🎯 Success Criteria

### Package is Ready When:

1. ✅ Can be installed via `npm install`
2. ✅ Works with zero configuration (sensible defaults)
3. ✅ Supports multiple frameworks (Angular, React, Vue, Node.js)
4. ✅ Detects 99% of breaking changes before merge
5. ✅ Has comprehensive documentation
6. ✅ <1% false positive rate
7. ✅ Processes typical PR in <2 minutes
8. ✅ Provides actionable, specific feedback
9. ✅ Supports custom plugins
10. ✅ Can run locally and in CI/CD

---

## 💰 Pricing Strategy (If Commercial)

### Free Tier

- Open source projects
- Basic analyzers
- Up to 100 PRs/month
- Community support

### Pro Tier ($49/month)

- Unlimited PRs
- All analyzers including impact analysis
- Priority support
- Custom rules
- Private repositories

### Enterprise Tier (Custom)

- On-premise deployment
- Custom integrations
- SLA guarantees
- Dedicated support
- Training & onboarding

---

## 📚 Documentation Structure

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── configuration.md
├── analyzers/
│   ├── code-quality.md
│   ├── security.md
│   ├── impact-analysis.md
│   └── performance.md
├── guides/
│   ├── writing-plugins.md
│   ├── custom-rules.md
│   └── ci-cd-integration.md
├── api/
│   ├── cli.md
│   ├── programmatic.md
│   └── config-reference.md
└── examples/
    ├── angular-project.md
    ├── react-project.md
    └── node-api.md
```

---

## 🚀 Next Steps

1. **Restructure current code** to be package-ready
2. **Build impact analyzer** as the killer feature
3. **Create comprehensive test suite** for the package itself
4. **Write migration guide** from current setup to package
5. **Build example integrations** for popular frameworks
6. **Publish beta version** to npm for testing
7. **Gather feedback** from early adopters
8. **Iterate and improve** based on real-world usage
9. **Official 1.0 release** when stable and proven

---

**Next Document:** See `02-bulletproof-features-plan.md` for detailed implementation of impact analysis and breaking change detection.
