# PR Guardian NPM Package Structure

## 📁 Recommended Package Structure

```
@pr-guardian/core/
├── package.json                    # Package metadata
├── tsconfig.json                   # TypeScript config
├── README.md                       # Package documentation
├── LICENSE                         # MIT License
├── .npmignore                      # Files to exclude from package
├── .eslintrc.js                    # ESLint config
├── .prettierrc                     # Prettier config
├── jest.config.js                  # Jest config
│
├── src/                            # Source TypeScript files
│   ├── index.ts                   # Main export
│   ├── cli.ts                     # CLI entry point
│   │
│   ├── core/
│   │   ├── PRGuardian.ts         # Main orchestrator class
│   │   ├── Config.ts             # Configuration management
│   │   ├── Reporter.ts           # Report generation
│   │   └── CacheManager.ts       # Caching system
│   │
│   ├── analyzers/
│   │   ├── DependencyGraphAnalyzer.ts
│   │   ├── CallGraphAnalyzer.ts
│   │   ├── ContractVerifier.ts
│   │   ├── StateMutationTracker.ts
│   │   ├── PerformanceAnalyzer.ts
│   │   ├── MergeDecisionEngine.ts
│   │   └── PRLearningAnalyzer.ts
│   │
│   ├── utils/
│   │   ├── ast-utils.ts          # AST helper functions
│   │   ├── git-utils.ts          # Git operations
│   │   ├── file-utils.ts         # File operations
│   │   └── logger.ts             # Logging utilities
│   │
│   └── types/
│       ├── config.types.ts       # Configuration types
│       ├── analyzer.types.ts     # Analyzer result types
│       └── index.ts              # Type exports
│
├── dist/                           # Compiled JavaScript (gitignored)
│   ├── index.js
│   ├── index.d.ts
│   ├── cli.js
│   └── ...
│
├── templates/                      # CI/CD templates
│   ├── azure-pipelines.yml       # Azure DevOps template
│   ├── github-workflow.yml       # GitHub Actions template
│   ├── gitlab-ci.yml             # GitLab CI template
│   └── .pr-guardian.config.js    # Example config
│
└── tests/                          # Test files
    ├── unit/
    │   ├── analyzers/
    │   └── utils/
    ├── integration/
    └── fixtures/
```

## 📦 Files to Create

### 1. Package Root Files

- ✅ package.json (created)
- ⏳ tsconfig.json
- ⏳ README.md (package version)
- ⏳ LICENSE
- ⏳ .npmignore
- ⏳ jest.config.js

### 2. Source Reorganization

Move from `scripts/ai-review/*.js` to `src/analyzers/*.ts` with TypeScript

### 3. Templates for CI/CD

- Azure Pipelines
- GitHub Actions
- GitLab CI

### 4. CLI Interface

Professional CLI with commands like:

```bash
pr-guardian analyze
pr-guardian init
pr-guardian learn
pr-guardian config
```

## 🚀 Next Steps

Run the build script to see what needs to be created:

```bash
node scripts/create-npm-package.js
```
