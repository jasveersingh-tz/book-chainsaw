# PR Guardian - Secure Package Deployment Guide

## 🔐 Security Architecture

### What Gets Published to NPM

```
@pr-guardian/core/
├── lib/                    # ✅ OBFUSCATED CODE ONLY
│   ├── index.js           # Main entry (obfuscated)
│   ├── core/
│   │   ├── pr-guardian.js # Main logic (obfuscated)
│   │   └── init.js        # Auto-init (obfuscated)
│   └── analyzers/         # All analyzers (obfuscated)
│       ├── dependency-graph-analyzer.js
│       ├── call-graph-analyzer.js
│       ├── contract-verifier.js
│       ├── state-mutation-tracker.js
│       ├── performance-analyzer.js
│       ├── merge-decision-engine.js
│       └── pr-learning-analyzer.js
├── bin/
│   └── cli.js             # CLI wrapper
├── templates/             # CI/CD templates
├── README.md
├── LICENSE
└── package.json
```

### What Stays PRIVATE (Never Published)

```
pr-guardian-package/
├── src/                   # ❌ SOURCE CODE (NOT PUBLISHED)
│   ├── core/
│   └── analyzers/
├── scripts/               # ❌ BUILD SCRIPTS (NOT PUBLISHED)
├── tests/                 # ❌ TEST FILES (NOT PUBLISHED)
└── node_modules/          # ❌ DEPENDENCIES (NOT PUBLISHED)
```

## 🛡️ Security Features

### 1. Code Obfuscation

**What it does:**

- Renames variables to meaningless names (`_0x1a2b`, `_0x3c4d`)
- Flattens control flow (makes logic unreadable)
- Injects dead code (confuses reverse engineering)
- Converts strings to encoded arrays
- Adds Unicode escape sequences

**Example:**

**Original (src/analyzers/call-graph-analyzer.js):**

```javascript
function detectSignatureChanges(filePath, content) {
  const functions = parseFunctions(content);
  return functions.map((fn) => ({
    name: fn.name,
    params: fn.params,
  }));
}
```

**Obfuscated (lib/analyzers/call-graph-analyzer.js):**

```javascript
var _0x4a2b = ['detectSignatureChanges', 'parseFunctions', 'map', 'name', 'params'];
(function (_0x1c3d, _0x5e6f) {
  var _0x7g8h = function (_0x9i0j) {
    while (--_0x9i0j) {
      _0x1c3d['push'](_0x1c3d['shift']());
    }
  };
  _0x7g8h(++_0x5e6f);
})(_0x4a2b, 0x123);
var _0xa1b2 = function (_0xc3d4, _0xe5f6) {
  _0xc3d4 = _0xc3d4 - 0x0;
  var _0xg7h8 = _0x4a2b[_0xc3d4];
  return _0xg7h8;
};
function _0xi9j0(_0xk1l2, _0xm3n4) {
  var _0xo5p6 = _0xa1b2('0x0')(_0xm3n4);
  return _0xo5p6[_0xa1b2('0x2')](function (_0xq7r8) {
    return {
      [_0xa1b2('0x3')]: _0xq7r8[_0xa1b2('0x3')],
      [_0xa1b2('0x4')]: _0xq7r8[_0xa1b2('0x4')],
    };
  });
}
```

**Result:** Core logic is protected, intellectual property is secure.

### 2. Auto-Initialization (First Run)

When a user runs `npx pr-guardian analyze` for the first time:

```
🎬 PR Guardian - First Time Setup

This will analyze your repository to learn patterns...

📚 Analyzing last 100 commits to learn patterns...
   Found 100 commits

   ✓ Pattern analysis complete
   ✓ Learned 8 commit types
   ✓ Identified 20 common patterns

✅ Initialization complete!
   PR Guardian is now tuned to your repository.
```

**What happens:**

1. Checks if `.pr-guardian-initialized` exists
2. If NOT → Runs initialization:
   - Analyzes last **100 commits** (configurable)
   - Extracts commit patterns
   - Identifies common keywords
   - Saves to `learned-patterns.json`
   - Creates `.pr-guardian-initialized` marker
3. If EXISTS → Skips initialization, runs analysis

**Security:** All data stays local, nothing sent externally.

### 3. Local Testing BEFORE Publishing

Critical step to validate on YOUR production project.

## 📋 Complete Deployment Workflow

### Phase 1: Create Secure Package

```bash
# In book-chainsaw directory
node scripts/create-secure-package.js
```

**Output:**

```
🔐 Creating Secure NPM Package for PR Guardian

📁 Creating secure directory structure...
   ✓ pr-guardian-package
   ✓ pr-guardian-package/src
   ✓ pr-guardian-package/src/core
   ✓ pr-guardian-package/src/analyzers
   ✓ pr-guardian-package/lib
   ✓ pr-guardian-package/bin
   ✓ pr-guardian-package/templates
   ✓ pr-guardian-package/tests

📦 Copying source files...
   ✓ dependency-graph-analyzer.js
   ✓ call-graph-analyzer.js
   ✓ contract-verifier.js
   ✓ state-mutation-tracker.js
   ✓ performance-analyzer.js
   ✓ merge-decision-engine.js
   ✓ pr-learning-analyzer.js
   ✓ pr-guardian.js

🔐 Creating secure build configuration...
   ✓ package.json with obfuscation pipeline
   ✓ Build scripts created

🎬 Creating auto-initialization system...
   ✓ Auto-initialization system created
   ✓ Added initialization hook to main file

🧪 Creating local testing setup...
   ✓ Local testing script created

📚 Creating documentation...
   ✓ README.md
   ✓ TESTING.md

✅ Secure package structure created!
```

### Phase 2: Build Package (Obfuscate)

```bash
cd pr-guardian-package
npm install
npm run build
```

**Build pipeline executes:**

1. **Clean:** `rimraf lib`
2. **Copy:** `src/ → lib/` (copies all source files)
3. **Obfuscate:** Runs `javascript-obfuscator` on `lib/`
   - Control flow flattening: ✅
   - Dead code injection: ✅
   - String array encoding: ✅ (75% threshold)
   - Unicode escape sequences: ✅
4. **Finalize:**
   - Creates `bin/cli.js` wrapper
   - Creates `lib/index.js` main export
5. **Validate:** Checks all required files exist

**Output:**

```
📋 Copying source files to lib/...
   ✓ core/pr-guardian.js
   ✓ core/init.js
   ✓ analyzers/dependency-graph-analyzer.js
   ✓ analyzers/call-graph-analyzer.js
   ✓ analyzers/contract-verifier.js
   ✓ analyzers/state-mutation-tracker.js
   ✓ analyzers/performance-analyzer.js
   ✓ analyzers/merge-decision-engine.js
   ✓ analyzers/pr-learning-analyzer.js
✅ Copy complete

🔐 Obfuscating code...
[javascript-obfuscator] Processing 9 files...
[javascript-obfuscator] ✅ Complete
✅ Obfuscation complete

🔧 Finalizing build...
   ✓ CLI wrapper created
   ✓ Main index created
✅ Build finalized

✅ Validating build...
   ✓ index.js
   ✓ analyzers/dependency-graph-analyzer.js
   ✓ analyzers/call-graph-analyzer.js
   ✓ analyzers/contract-verifier.js
   ✓ analyzers/state-mutation-tracker.js
   ✓ analyzers/performance-analyzer.js
   ✓ analyzers/merge-decision-engine.js
   ✓ analyzers/pr-learning-analyzer.js
   ✓ core/pr-guardian.js
✅ Build validation passed!
```

### Phase 3: Test Locally on Production Project

**CRITICAL:** Test on YOUR actual production project before publishing.

```bash
npm run test:local
```

**Interactive session:**

```
🧪 PR Guardian - Local Testing Setup

This will help you test the package on your production project

📦 Step 1: Building package...
✅ Build complete

🔗 Step 2: Creating local link...
✅ Link created

📁 Enter path to your production project: D:/my-big-prod-project

🔗 Step 3: Linking to D:/my-big-prod-project...
✅ Linked successfully

📋 Testing Instructions:

   1. cd D:/my-big-prod-project
   2. npx pr-guardian analyze
   3. Review the output

💡 To test initialization:
   1. rm D:/my-big-prod-project/.pr-guardian-initialized
   2. npx pr-guardian analyze
   3. Watch it analyze 100 commits

🚀 Run test now? (y/n): y

🎬 Running PR Guardian on your production project...
```

**First run output (initialization):**

```
🎬 PR Guardian - First Time Setup

This will analyze your repository to learn patterns...

📚 Analyzing last 100 commits to learn patterns...
   Found 100 commits

   ✓ Pattern analysis complete
   ✓ Learned 12 commit types
   ✓ Identified 25 common patterns

✅ Initialization complete!
   PR Guardian is now tuned to your repository.

🔍 PR Guardian - Analysis Starting
📊 Analyzing 245 files...
...
✅ Analysis complete
```

**Second run (skips initialization):**

```
✅ PR Guardian already initialized

🔍 PR Guardian - Analysis Starting
📊 Analyzing 245 files...
...
```

### Phase 4: Verify Security

Check that obfuscation worked:

```bash
# In pr-guardian-package directory
cat lib/analyzers/call-graph-analyzer.js | head -20
```

**You should see:**

```javascript
var _0x3a2b=['length','push','shift','detectSignatureChanges',...];
(function(_0x1c3d,_0x5e6f){var _0x7g8h=function(_0x9i0j){...
```

**NOT readable source code.**

### Phase 5: Publish to NPM

```bash
# Login to NPM (first time only)
npm login

# Publish
npm publish --access public
```

**Pre-publish validation runs automatically:**

```
> @pr-guardian/core@1.0.0 prepublishOnly
> npm run build && npm run validate

📦 Building...
✅ Build complete

✅ Validating...
   ✓ All required files present
   ✓ Obfuscation verified
   ✓ No source code in dist
✅ Validation passed

Publishing to NPM...
+ @pr-guardian/core@1.0.0
✅ Published!
```

## 🧹 Clean Up After Testing

```bash
# In your production project
cd D:/my-big-prod-project
npm unlink @pr-guardian/core

# In package directory
cd pr-guardian-package
npm unlink
```

## 🚀 Installation by End Users

### First Install

```bash
npm install --save-dev @pr-guardian/core
```

### First Run (Auto-Initialization)

```bash
npx pr-guardian analyze
```

**Output:**

```
🎬 PR Guardian - First Time Setup

📚 Analyzing last 100 commits to learn patterns...
   Found 100 commits
   ✓ Pattern analysis complete
   ✓ Learned 8 commit types
   ✓ Identified 20 common patterns

✅ Initialization complete!

🔍 Starting analysis...
✅ Analysis complete: 0 breaking changes detected
```

**Creates:**

- `.pr-guardian-initialized` (marks as initialized)
- `lib/learned-patterns.json` (inside node_modules)

### Subsequent Runs

```bash
npx pr-guardian analyze
```

**Output:**

```
✅ PR Guardian already initialized

🔍 Starting analysis...
✅ Analysis complete
```

**No re-initialization, instant analysis.**

## 🔒 Security Guarantees

✅ **Source code NEVER published** - Only obfuscated `lib/` directory
✅ **Logic is unreadable** - Advanced obfuscation techniques
✅ **No external API calls** - Everything runs locally
✅ **Zero data collection** - No telemetry, no tracking
✅ **Auto-learning stays local** - Patterns saved in `node_modules`
✅ **Git history analysis local** - Uses `git log` on user's machine

## 📊 What Gets Learned (First Run)

From last 100 commits, PR Guardian learns:

1. **Commit Types** (e.g., feat, fix, refactor, docs)
2. **Common Keywords** (e.g., breaking, memory, performance)
3. **Author Patterns** (number of unique contributors)
4. **Frequency Data** (what changes are common)

**Example learned-patterns.json:**

```json
{
  "totalCommits": 100,
  "commitTypes": {
    "feat": 45,
    "fix": 30,
    "refactor": 15,
    "docs": 10
  },
  "commonKeywords": [
    "breaking",
    "memory",
    "performance",
    "security",
    "fix",
    "update",
    "add",
    "remove"
  ],
  "authorCount": 8,
  "analyzedAt": "2026-02-23T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 🐛 Troubleshooting

### Issue: "Cannot find module @pr-guardian/core"

**Solution:**

```bash
# Rebuild package
npm run build

# Verify lib/ exists
ls lib/
```

### Issue: "Not a git repository"

**Solution:**

```bash
# Ensure you're in a git repo
git status

# If not initialized:
git init
```

### Issue: "Initialization hanging"

**Possible causes:**

- Very large repository (>10,000 commits)
- Slow git operations

**Solution:**

```bash
# Skip initialization, use defaults
touch .pr-guardian-initialized
npx pr-guardian analyze
```

### Issue: "Code is still readable in lib/"

**Solution:**

```bash
# Check obfuscator ran
cat lib/index.js

# Should see obfuscated code
# If not, rebuild:
npm run clean
npm run build
```

## 📝 Checklist Before Publishing

- [ ] Run `npm run build` - builds and obfuscates
- [ ] Check `lib/` has obfuscated code (unreadable)
- [ ] Verify `src/` is in `.npmignore`
- [ ] Test locally on production project
- [ ] Test initialization (analyze 100 commits)
- [ ] Test second run (skips initialization)
- [ ] Clean up test links (`npm unlink`)
- [ ] Review `package.json` metadata
- [ ] Check version number
- [ ] Run `npm publish --access public`

## 🎯 Summary

**Security:** ✅ Source code protected via obfuscation
**Initialization:** ✅ Auto-learns from 100 commits on first run
**Local Testing:** ✅ Test on prod project before publishing
**Publishing:** ✅ Only obfuscated `lib/` gets published

**Ready to deploy!** 🚀
