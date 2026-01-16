# GitHub Actions Quick Reference

## File Locations

```
.github/
├── workflows/
│   ├── ai-code-review.yml       ← Main AI PR review
│   ├── build-test.yml           ← CI/CD tests
│   └── code-quality.yml         ← Code quality checks
```

## What Each Workflow Does

### 1️⃣ AI Code Review (`ai-code-review.yml`)

**When?** Every PR (opened/edited/synchronized)

**What?**

- Analyzes code quality
- Checks security
- Validates logic
- Scores 0-100
- Auto-comments PR

**Output:** 🤖 AI Score badge + detailed comment

---

### 2️⃣ Build & Test (`build-test.yml`)

**When?** Push to main branches OR PR

**What?**

- Runs on Node 18.x and 20.x
- ESLint validation
- Project build
- Test suite
- Coverage report

**Output:** ✅/❌ Status check

---

### 3️⃣ Code Quality (`code-quality.yml`)

**When?** PR with code changes

**What?**

- TypeScript strict mode
- Security scanning
- Complexity analysis

**Output:** 📊 Quality report comment

---

## Setup Checklist

- [ ] Workflows exist in `.github/workflows/`
- [ ] Repository has Actions enabled
- [ ] Branch protection rules configured
- [ ] Status checks required: `ai-code-review`, `build-test`, `code-quality`
- [ ] Test locally: `npm ci && npm run lint && npm run build && npm run test:ci`
- [ ] Create first PR to verify workflows

---

## Common Commands

```bash
# Test locally before pushing
npm run lint          # ESLint check
npm run build         # TypeScript build
npm run test:ci       # Run tests headless

# Fix common issues
npm run lint:fix      # Auto-fix linting issues
npm ci                # Clean install dependencies
```

---

## PR Workflow

```
1. Create PR
   ↓
2. Workflows trigger automatically
   ↓
3. AI review comments on PR (30-60 sec)
   ↓
4. Address any issues if needed
   ↓
5. Manual code review
   ↓
6. Approve & merge (all checks ✅)
```

---

## AI Score Meaning

| Score  | Status       | Action             |
| ------ | ------------ | ------------------ |
| 90-100 | 🟢 Excellent | Ready to merge     |
| 75-89  | 🟡 Good      | Minor improvements |
| 0-74   | 🔴 Poor      | Must fix issues    |

---

## Status Check Icons

| Icon | Meaning        |
| ---- | -------------- |
| ✅   | Passed         |
| ❌   | Failed         |
| ⏳   | Running        |
| ⊘    | Skipped        |
| 🤖   | AI Review      |
| 📊   | Quality Report |

---

## Branch Naming (Required)

Valid prefixes:

- `feature/` - New feature
- `bugfix/` - Bug fix
- `hotfix/` - Critical fix
- `chore/` - Maintenance
- `refactor/` - Code cleanup
- `docs/` - Documentation

Example: `feature/add-user-auth`

---

## PR Title/Description Requirements

**Title:**

- Minimum 10 characters
- Descriptive
- Max 100 characters

**Description:**

- Minimum 20 characters
- Explain what and why
- Better: 50+ characters

---

## Security Checks

❌ Don't commit:

- Passwords
- API keys
- Tokens
- Private credentials
- `console.log` in production

✅ Workflow detects these automatically

---

## Troubleshooting

### Workflows not running?

- Check `.github/workflows/` exists
- Check Actions enabled in settings
- Check YAML syntax (eslint-online.com)

### AI comment not posting?

- Check branch protection rules
- Verify workflow permissions
- Check GitHub token scopes

### Build failing?

- Run `npm ci` (clean install)
- Run `npm run lint` (check syntax)
- Run `npm run build` (compile)
- Check error messages in logs

### Tests failing?

- Run `npm run test:ci` locally
- Debug failing tests
- Ensure all dependencies installed

---

## Customization

**Change AI score threshold:**
In `ai-code-review.yml`, find:

```javascript
const shouldApprove = finalScore >= 85; // Change this number
```

**Add custom checks:**
Edit `analyze.js` section in workflow

**Modify ESLint rules:**
Edit `.eslintrc.json`

**Change branch names:**
Edit `validPrefixes` array in workflow

---

## Resources

📖 **Documentation Files:**

- `GITHUB_ACTIONS_SETUP.md` - Full setup guide
- `GITHUB_ACTIONS_COMPLETE.md` - Implementation details
- `AI_PR_REVIEW_GUIDE.md` - Feature details (reference)

🔗 **GitHub Docs:**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)

---

## Cost

✅ **Free:**

- 2,000 minutes/month (public repos)
- Unlimited workflows
- No external service costs
- No license needed

---

**Everything is set up and ready to use!**

Just commit workflows, configure branch rules, and start using.
