# 🚀 Quick Start - PR Guardian NPM Package

## ⚡ Fast Track to Publishing

### 1️⃣ Build the Package (3 minutes)

```bash
cd pr-guardian-package
npm install
npm run build
```

**What happens:**

- ✅ Installs `javascript-obfuscator` and dependencies
- ✅ Copies source files from `src/` to `lib/`
- ✅ **Obfuscates all code** (protects your logic)
- ✅ Creates CLI wrapper and main index
- ✅ Validates build

**Expected output:**

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
[javascript-obfuscator] Processing files...
✅ Obfuscation complete

🔧 Finalizing build...
   ✓ CLI wrapper created
   ✓ Main index created
✅ Build finalized

✅ Validating build...
   ✓ index.js
   ✓ All 9 files present
✅ Build validation passed!
```

---

### 2️⃣ Test on Your Production Project (5 minutes)

```bash
npm run test:local
```

**Interactive prompts:**

```
📁 Enter path to your production project: D:/my-big-prod-project

🔗 Linking to D:/my-big-prod-project...
✅ Linked successfully

🚀 Run test now? (y/n): y
```

**First run will:**

```
🎬 PR Guardian - First Time Setup

📚 Analyzing last 100 commits to learn patterns...
   Found 100 commits
   ✓ Pattern analysis complete
   ✓ Learned 12 commit types
   ✓ Identified 25 common patterns

✅ Initialization complete!

🔍 Starting analysis...
✅ Analysis complete: 0 breaking changes detected
```

**Run again to test skip initialization:**

```bash
cd D:/my-big-prod-project
npx pr-guardian analyze
```

**Should see:**

```
✅ PR Guardian already initialized

🔍 Starting analysis...
✅ Analysis complete
```

**Clean up when done:**

```bash
# In your production project
npm unlink @pr-guardian/core

# In pr-guardian-package
npm unlink
```

---

### 3️⃣ Verify Security (1 minute)

```bash
# Check that code is obfuscated
cat lib/analyzers/call-graph-analyzer.js | head -20
```

**Should see unreadable code:**

```javascript
var _0x3a2b=['length','push','shift','detectSignatureChanges',...];
(function(_0x1c3d,_0x5e6f){var _0x7g8h=function(_0x9i0j){
  while(--_0x9i0j){_0x1c3d['push'](_0x1c3d['shift']());}
};_0x7g8h(++_0x5e6f);}(_0x3a2b,0x123));
```

**NOT readable source code** ✅

```bash
# Verify .npmignore protects source
cat .npmignore
```

**Should see:**

```
# Source code (DO NOT PUBLISH)
src/
scripts/
tests/
```

---

### 4️⃣ Publish to NPM (2 minutes)

```bash
# Login (first time only)
npm login

# Publish
npm publish --access public
```

**Pre-publish checks run automatically:**

```
> @pr-guardian/core@1.0.0 prepublishOnly
> npm run build && npm run validate

✅ Build complete
✅ Validation passed

Publishing to https://registry.npmjs.org/
+ @pr-guardian/core@1.0.0
✅ Published successfully!
```

---

## 🎯 Your Requirements - All Met

### ✅ 1. Security (No one can view/edit main logic)

**Solution:** Code obfuscation

- Source code in `src/` is NEVER published (`.npmignore`)
- Only obfuscated `lib/` code is published
- Variables renamed to `_0x1a2b`, `_0x3c4d`
- Control flow flattened (unreadable logic)
- Dead code injected (confuses reverse engineering)

**Verification:**

```bash
cat lib/core/pr-guardian.js
# Unreadable obfuscated code ✅
```

### ✅ 2. Auto-Initialize from 100 Commits

**Solution:** First-run initialization

- Automatically runs on first `npx pr-guardian analyze`
- Analyzes last 100 commits/PRs
- Learns commit patterns, keywords, authors
- Saves to `learned-patterns.json`
- Creates `.pr-guardian-initialized` marker
- Subsequent runs skip initialization

**Verification:**

```bash
# In test project
rm .pr-guardian-initialized
npx pr-guardian analyze
# Should analyze 100 commits ✅
```

### ✅ 3. Test on Production Project Before Publishing

**Solution:** Local testing script

- `npm run test:local` command
- Uses `npm link` for local installation
- Interactive prompts for project path
- Runs full analysis on YOUR actual codebase
- Clean unlink when done

**Verification:**

```bash
npm run test:local
# Enter your prod project path
# Test initialization and analysis ✅
```

---

## 📦 What Gets Published

```
@pr-guardian/core@1.0.0
├── lib/                    # Obfuscated code (500KB)
├── bin/cli.js             # CLI wrapper
├── templates/             # CI/CD templates
├── README.md              # Documentation
├── LICENSE                # MIT
└── package.json           # Metadata
```

**Total size:** ~500KB

---

## 🔒 What Stays Private

```
pr-guardian-package/
├── src/                   # ❌ Source code (PROTECTED)
├── scripts/               # ❌ Build scripts (PROTECTED)
├── tests/                 # ❌ Tests (PROTECTED)
└── TESTING.md            # ❌ Internal docs (PROTECTED)
```

**Controlled by `.npmignore`**

---

## 🎬 End User Experience

### Installation

```bash
npm install --save-dev @pr-guardian/core
```

### First Use

```bash
npx pr-guardian analyze
```

**Output:**

```
🎬 PR Guardian - First Time Setup

📚 Analyzing last 100 commits to learn patterns...
   Found 100 commits
   ✓ Learned 12 commit types
   ✓ Identified 25 common patterns

✅ Initialization complete!

🔍 Starting analysis...
✅ 0 breaking changes detected
```

### Daily Use

```bash
npx pr-guardian analyze
```

**Output:**

```
✅ PR Guardian already initialized

🔍 Starting analysis...
✅ 0 breaking changes detected
```

**Fast and efficient!**

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
npm run build
ls lib/  # Should show obfuscated files
```

### Error: "Not a git repository"

```bash
git status  # Verify you're in a git repo
```

### Code is still readable in lib/

```bash
npm run clean
npm run build  # Rebuild with obfuscation
cat lib/index.js  # Should be unreadable
```

---

## 📊 Build Commands Reference

| Command                       | Purpose                |
| ----------------------------- | ---------------------- |
| `npm install`                 | Install dependencies   |
| `npm run clean`               | Remove old build       |
| `npm run build`               | Full build + obfuscate |
| `npm run build:copy`          | Copy src → lib         |
| `npm run build:obfuscate`     | Obfuscate code         |
| `npm run build:finalize`      | Create wrappers        |
| `npm run validate`            | Check build            |
| `npm run test:local`          | Test on prod project   |
| `npm link`                    | Link locally           |
| `npm unlink`                  | Unlink                 |
| `npm publish --access public` | Publish to NPM         |

---

## ✅ Pre-Publish Checklist

- [ ] `cd pr-guardian-package`
- [ ] `npm install`
- [ ] `npm run build`
- [ ] Verify `lib/` has obfuscated code
- [ ] `npm run test:local`
- [ ] Test on YOUR production project
- [ ] Test initialization (100 commits)
- [ ] Test second run (skips init)
- [ ] Clean up: `npm unlink` in both places
- [ ] `npm login` (if first time)
- [ ] `npm publish --access public`
- [ ] 🎉 **DONE!**

---

## 🚀 You're Ready!

All requirements implemented:
✅ Security (obfuscation)
✅ Auto-initialization (100 commits)
✅ Local testing (production verification)

**Next step:** Run the 4 commands above and publish! 🎯
