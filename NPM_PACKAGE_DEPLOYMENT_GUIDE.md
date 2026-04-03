# PR Guardian NPM Package - Production Deployment Guide

## 🎯 Recommended Changes for NPM Package

### 1. Package Structure Improvements

#### Current Issues to Fix:

```
✅ GOOD: Scripts are standalone JavaScript files
❌ NEEDS FIX: Hardcoded paths (relative to book-chainsaw)
❌ NEEDS FIX: No package.json for distribution
❌ NEEDS FIX: No CLI interface
❌ NEEDS FIX: No configuration system
❌ NEEDS FIX: Dependencies embedded (need peer dependencies)
```

### 2. Required Changes Before Publishing

#### A. Create Proper Package Structure

```
@your-org/pr-guardian/
├── package.json                 # NEW: Package metadata
├── README.md                    # NEW: Usage documentation
├── LICENSE                      # NEW: MIT license
├── .npmignore                   # NEW: Exclude dev files
├── bin/
│   └── pr-guardian.js          # NEW: CLI entry point
├── lib/
│   ├── analyzers/
│   │   ├── dependency-graph-analyzer.js  # MOVED from scripts/ai-review/
│   │   ├── call-graph-analyzer.js        # MOVED from scripts/ai-review/
│   │   ├── contract-verifier.js          # MOVED from scripts/ai-review/
│   │   ├── state-mutation-tracker.js     # MOVED from scripts/ai-review/
│   │   ├── performance-analyzer.js       # MOVED from scripts/ai-review/
│   │   └── merge-decision-engine.js      # MOVED from scripts/ai-review/
│   ├── core/
│   │   ├── file-scanner.js     # NEW: Framework-agnostic file discovery
│   │   ├── config-loader.js    # NEW: Load .pr-guardian.config.js
│   │   └── reporter.js         # NEW: Unified reporting
│   └── utils/
│       ├── git-utils.js        # NEW: Git operations
│       └── ast-utils.js        # NEW: Shared AST utilities
├── config/
│   └── default.config.js       # NEW: Default configuration
└── templates/
    ├── github-workflow.yml     # NEW: CI/CD template
    └── .pr-guardian.config.js  # NEW: Config template
```

#### B. Fix Path Dependencies

**BEFORE (Hardcoded):**

```javascript
// ❌ BAD: Assumes running in book-chainsaw project
const files = glob.sync('src/**/*.ts');
```

**AFTER (Configurable):**

```javascript
// ✅ GOOD: Uses project's configuration
const config = require('./config-loader');
const files = glob.sync(config.sourcePatterns);
```

#### C. Create package.json

```json
{
  "name": "@your-org/pr-guardian",
  "version": "1.0.0",
  "description": "Bulletproof PR protection - catches breaking changes in 2 seconds",
  "main": "lib/index.js",
  "bin": {
    "pr-guardian": "bin/pr-guardian.js"
  },
  "scripts": {
    "test": "jest",
    "prepublishOnly": "npm test"
  },
  "keywords": [
    "pr-review",
    "code-analysis",
    "breaking-changes",
    "ci-cd",
    "typescript",
    "javascript",
    "angular",
    "react"
  ],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "@typescript-eslint/parser": ">=6.0.0",
    "typescript": ">=4.7.0"
  },
  "dependencies": {
    "glob": "^10.3.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/pr-guardian.git"
  }
}
```

#### D. Create CLI Entry Point

**bin/pr-guardian.js:**

```javascript
#!/usr/bin/env node

const path = require('path');
const { PRGuardian } = require('../lib/index');

// Find project root (where package.json exists)
const projectRoot = process.cwd();

// Load configuration
const config = require('../lib/core/config-loader')(projectRoot);

// Run analysis
const guardian = new PRGuardian(config);
guardian
  .analyze()
  .then((result) => {
    process.exit(result.shouldBlock ? 1 : 0);
  })
  .catch((error) => {
    console.error('PR Guardian failed:', error);
    process.exit(1);
  });
```

#### E. Create Configuration System

**lib/core/config-loader.js:**

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function loadConfig(projectRoot) {
  // Default configuration
  const defaults = {
    sourcePatterns: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
    excludePatterns: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ],
    thresholds: {
      criticalIssuesMax: 0,
      highIssuesMax: 5,
      breakingChangesMax: 0,
      minScore: 70,
    },
    analyzers: {
      dependencyGraph: true,
      callGraph: true,
      contracts: true,
      stateMutations: true,
      performance: true,
    },
  };

  // Try to load user config
  const configPath = path.join(projectRoot, '.pr-guardian.config.js');
  if (fs.existsSync(configPath)) {
    const userConfig = require(configPath);
    return { ...defaults, ...userConfig };
  }

  return defaults;
};
```

#### F. Framework Detection

**lib/core/framework-detector.js:**

```javascript
const fs = require('fs');
const path = require('path');

function detectFramework(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return 'unknown';
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (deps['@angular/core']) return 'angular';
  if (deps['react']) return 'react';
  if (deps['vue']) return 'vue';
  if (deps['svelte']) return 'svelte';

  return 'generic';
}

function getDefaultPatterns(framework) {
  const patterns = {
    angular: {
      source: ['src/**/*.ts', 'src/**/*.html'],
      exclude: ['**/*.spec.ts', '**/test.ts', '**/e2e/**'],
    },
    react: {
      source: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js'],
    },
    vue: {
      source: ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.js'],
      exclude: ['**/*.spec.ts', '**/*.spec.js'],
    },
    generic: {
      source: ['src/**/*.ts', 'src/**/*.js'],
      exclude: ['**/*.spec.*', '**/*.test.*'],
    },
  };

  return patterns[framework] || patterns.generic;
}

module.exports = { detectFramework, getDefaultPatterns };
```

---

## 📦 Installation Steps for Users

### Step 1: Install Package

```bash
npm install --save-dev @your-org/pr-guardian
```

**What this does:**

- Adds pr-guardian to devDependencies
- Installs CLI command: `pr-guardian`
- Downloads all analyzers

### Step 2: Create Configuration (Optional)

```bash
npx pr-guardian init
```

**Creates `.pr-guardian.config.js`:**

```javascript
module.exports = {
  // Source file patterns (auto-detected for Angular/React)
  sourcePatterns: ['src/**/*.ts', 'src/**/*.tsx'],

  // Files to ignore
  excludePatterns: ['**/*.spec.ts', '**/*.test.ts'],

  // Blocking thresholds
  thresholds: {
    criticalIssuesMax: 0, // Block if any critical issues
    highIssuesMax: 5, // Block if >5 high issues
    breakingChangesMax: 0, // Block if any breaking changes
    minScore: 70, // Block if score < 70
  },

  // Enable/disable analyzers
  analyzers: {
    dependencyGraph: true,
    callGraph: true,
    contracts: true,
    stateMutations: true,
    performance: true,
  },

  // Custom rules (optional)
  rules: {
    'no-console-log': 'warn',
    'require-tests': 'error',
  },
};
```

### Step 3: Add to package.json Scripts

```json
{
  "scripts": {
    "pr-check": "pr-guardian",
    "pre-commit": "pr-guardian --changed-only"
  }
}
```

### Step 4: Add to CI/CD Pipeline

#### GitHub Actions

**Create `.github/workflows/pr-guardian.yml`:**

```yaml
name: PR Guardian

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-guardian:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Need git history for comparison

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run PR Guardian
        run: npx pr-guardian

      # Optional: Comment results on PR
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('pr-guardian-report.json'));

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🛡️ PR Guardian Report\n\n${report.summary}`
            });
```

#### GitLab CI

**.gitlab-ci.yml:**

```yaml
pr-guardian:
  stage: test
  script:
    - npm ci
    - npx pr-guardian
  only:
    - merge_requests
  allow_failure: false
```

#### Jenkins

**Jenkinsfile:**

```groovy
stage('PR Guardian') {
  steps {
    sh 'npm ci'
    sh 'npx pr-guardian'
  }
}
```

### Step 5: Test Locally

```bash
# Run full analysis
npm run pr-check

# Run on changed files only (faster)
npx pr-guardian --changed-only

# Generate detailed report
npx pr-guardian --report=json --output=report.json

# Dry run (don't fail, just report)
npx pr-guardian --dry-run
```

---

## 🔧 Advanced Configuration Options

### Custom Rules

**Create `rules/custom-rules.js`:**

```javascript
module.exports = {
  name: 'custom-rules',

  rules: {
    'no-todo-comments': {
      severity: 'medium',
      check: (ast, file) => {
        const issues = [];
        const content = fs.readFileSync(file, 'utf-8');
        const todoRegex = /\/\/\s*TODO:/gi;

        let match;
        while ((match = todoRegex.exec(content)) !== null) {
          issues.push({
            file,
            line: content.substring(0, match.index).split('\n').length,
            message: 'TODO comment found',
            severity: 'medium',
          });
        }

        return issues;
      },
    },
  },
};
```

**Reference in config:**

```javascript
// .pr-guardian.config.js
module.exports = {
  customRules: './rules/custom-rules.js',
};
```

### Framework-Specific Configuration

#### Angular Projects

```javascript
// .pr-guardian.config.js
module.exports = {
  framework: 'angular',

  sourcePatterns: ['src/**/*.ts', 'src/**/*.html'],

  excludePatterns: ['**/*.spec.ts', '**/test.ts', '**/environments/**'],

  analyzers: {
    dependencyGraph: true,
    callGraph: true,
    contracts: true,
    stateMutations: true,
    performance: true,

    // Angular-specific
    angularLifecycle: true,
    angularTemplates: true,
  },
};
```

#### React Projects

```javascript
// .pr-guardian.config.js
module.exports = {
  framework: 'react',

  sourcePatterns: ['src/**/*.tsx', 'src/**/*.ts', 'src/**/*.jsx', 'src/**/*.js'],

  excludePatterns: ['**/*.test.tsx', '**/*.test.ts', '**/__tests__/**'],

  analyzers: {
    dependencyGraph: true,
    callGraph: true,
    contracts: true,
    stateMutations: true,
    performance: true,

    // React-specific
    reactHooks: true,
    reactComponents: true,
  },
};
```

---

## 🚀 Migration Guide (From book-chainsaw)

### For Current book-chainsaw Users

**Before:**

```bash
# Running locally
node scripts/ai-review/pr-guardian.js

# In CI
- run: node scripts/ai-review/pr-guardian.js
```

**After:**

```bash
# 1. Install package
npm install --save-dev @your-org/pr-guardian

# 2. Remove old scripts
rm -rf scripts/ai-review/

# 3. Update CI workflow
- run: npx pr-guardian

# 4. Run locally
npx pr-guardian
```

---

## 📊 Expected Workflow After Installation

### 1. Developer Workflow

```bash
# Developer creates feature branch
git checkout -b feature/new-api

# Makes changes
# ... edit files ...

# Before committing, run PR Guardian
npm run pr-check

# If blocked:
❌ BLOCK_MERGE
Critical: 1 - Fix before pushing

# Fix issues, run again
npm run pr-check

# If approved:
✅ APPROVE - Safe to push

# Push and create PR
git push origin feature/new-api
```

### 2. CI/CD Workflow

```
PR Created
    ↓
GitHub Actions triggers
    ↓
Install dependencies (npm ci)
    ↓
Run PR Guardian (npx pr-guardian)
    ↓
    ├─ ✅ APPROVE → Checks pass → Ready for review
    ├─ ⚠️  WARN → Checks pass → Review carefully
    └─ ❌ BLOCK → Checks fail → Cannot merge
```

### 3. Review Workflow

```
PR Guardian runs automatically
    ↓
Posts comment on PR with:
  - Score (0-100)
  - Critical issues (if any)
  - Breaking changes (if any)
  - Detailed analysis
    ↓
Human reviewer sees:
  - ✅ PR Guardian approved → Quick review
  - ⚠️  PR Guardian warnings → Careful review
  - ❌ PR Guardian blocked → Developer must fix
```

---

## 🎯 Recommended Package Features

### 1. Zero-Config Setup

```bash
npm install --save-dev @your-org/pr-guardian
npx pr-guardian  # Just works!
```

### 2. Smart Defaults

- Auto-detect Angular/React/Vue
- Auto-configure source patterns
- Sensible thresholds

### 3. Incremental Analysis

```bash
# Analyze only changed files (fast!)
npx pr-guardian --changed-only
```

### 4. Report Formats

```bash
# Console output (default)
npx pr-guardian

# JSON output
npx pr-guardian --format=json

# HTML report
npx pr-guardian --format=html --output=report.html

# GitHub comment format
npx pr-guardian --format=github
```

### 5. CI/CD Integrations

```bash
# GitHub Actions
npx pr-guardian --ci=github

# GitLab CI
npx pr-guardian --ci=gitlab

# Jenkins
npx pr-guardian --ci=jenkins
```

---

## 🔒 Production Best Practices

### 1. Version Pinning

```json
{
  "devDependencies": {
    "@your-org/pr-guardian": "^1.0.0"
  }
}
```

### 2. Caching in CI

```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

### 3. Timeout Configuration

```javascript
// .pr-guardian.config.js
module.exports = {
  timeout: 120000, // 2 minutes max
  maxFileSize: 1000000, // Skip files > 1MB
};
```

### 4. Parallel Analysis

```javascript
// .pr-guardian.config.js
module.exports = {
  parallel: true,
  maxWorkers: 4,
};
```

---

## 📈 Metrics & Monitoring

### Track Success Metrics

```javascript
// .pr-guardian.config.js
module.exports = {
  metrics: {
    enabled: true,
    endpoint: 'https://your-analytics.com/pr-guardian',
    track: ['analysis-time', 'issues-found', 'false-positives', 'blocked-prs'],
  },
};
```

---

## Summary: Key Changes Needed

### Before Publishing:

1. ✅ **Extract** scripts/ai-review/ → lib/analyzers/
2. ✅ **Create** package.json with proper metadata
3. ✅ **Build** CLI entry point (bin/pr-guardian.js)
4. ✅ **Add** configuration system (.pr-guardian.config.js)
5. ✅ **Implement** framework detection (Angular/React/Vue)
6. ✅ **Fix** hardcoded paths → use projectRoot
7. ✅ **Add** templates (workflow files, config examples)
8. ✅ **Write** comprehensive README with examples
9. ✅ **Add** tests for all analyzers
10. ✅ **Publish** to npm registry

### After Installing in Project:

1. ✅ `npm install --save-dev @your-org/pr-guardian`
2. ✅ `npx pr-guardian init` (optional config)
3. ✅ Add to CI/CD workflow
4. ✅ Add npm script: `"pr-check": "pr-guardian"`
5. ✅ Test locally: `npm run pr-check`
6. ✅ Commit and push → CI runs automatically

**That's it!** Zero complexity, maximum protection.
