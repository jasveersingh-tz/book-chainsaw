# SonarQube Standards & Compliance Guide

## Overview

This project enforces SonarQube quality standards for professional-grade code quality. All PRs are automatically scanned against these standards.

---

## 📊 Quality Gates (Must Pass)

### Critical Requirements

| Metric                   | Requirement    | Penalty                   |
| ------------------------ | -------------- | ------------------------- |
| **Bugs**                 | 0 (zero)       | -20 pts per bug           |
| **Vulnerabilities**      | 0 (zero)       | -25 pts per vulnerability |
| **Test Coverage**        | ≥80%           | -15 pts if below          |
| **Code Smells**          | ≤10            | -5 pts per 10 issues      |
| **Duplication**          | <3%            | -8 pts if exceeded        |
| **Cognitive Complexity** | <15 per method | -5 pts per method         |

### PR Approval Criteria

✅ **APPROVED** if:

- AI Score ≥ 85
- All bugs: 0
- All vulnerabilities: 0
- Lint score ≥ 90
- Tests passing ✓

❌ **REJECTED** if:

- Critical security issues found
- Bugs detected
- Coverage < 70%
- Any vulnerabilities

---

## 🔒 Security Standards

### Critical (Must Fix)

```typescript
// ❌ WRONG: Hardcoded password
const password = 'admin123';
const apiKey = 'sk-1234567890';
const token = 'eyJhbGciOiJIUzI1NiIs...';

// ✅ CORRECT: Use environment variables
const password = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;
const token = process.env.AUTH_TOKEN;
```

### High Priority

```typescript
// ❌ WRONG: Using innerHTML (XSS risk)
element.innerHTML = userInput;

// ✅ CORRECT: Use textContent or Angular binding
element.textContent = userInput;
// or in template
<div [textContent]="userInput"></div>
```

```typescript
// ❌ WRONG: Using eval()
const result = eval(userCode);

// ✅ CORRECT: Use Function constructor or alternatives
const result = new Function(userCode)();
```

```typescript
// ❌ WRONG: Unhandled promise
this.service.getData().then((data) => {
  // no .catch()
});

// ✅ CORRECT: Always handle errors
this.service
  .getData()
  .then((data) => {
    /* ... */
  })
  .catch((error) => {
    /* ... */
  });
```

### Medium Priority

```typescript
// ❌ WRONG: Empty catch block
try {
  // code
} catch (error) {
  // silently fail - BAD
}

// ✅ CORRECT: Log or handle error
try {
  // code
} catch (error) {
  console.error('Failed to process:', error);
  throw error; // or handle appropriately
}
```

```typescript
// ❌ WRONG: Console logging in production
console.log('Debug info:', data);

// ✅ CORRECT: Use logger service
this.logger.debug('Debug info:', data);
```

---

## 🎯 Type Safety Standards

### No 'any' Type

```typescript
// ❌ WRONG
function process(data: any): void {
  // Weak type safety
}

// ✅ CORRECT
interface DataModel {
  id: string;
  name: string;
}

function process(data: DataModel): void {
  // Strong type safety
}
```

### Strict Mode Requirements

```typescript
// ✅ REQUIRED in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 📝 Code Complexity Standards

### Cognitive Complexity Limits

```typescript
// ❌ TOO COMPLEX (>15 points)
function complexMethod(param1, param2) {
  if (param1 > 0) {
    if (param2 > 0) {
      if (isValid(param1)) {
        if (isValid(param2)) {
          if (canProcess()) {
            return process();
          }
        }
      }
    }
  }
  return null;
}

// ✅ REFACTORED
function complexMethod(param1, param2) {
  if (!areParametersValid(param1, param2)) {
    return null;
  }
  return canProcess() ? process() : null;
}

private areParametersValid(p1, p2): boolean {
  return p1 > 0 && p2 > 0 && isValid(p1) && isValid(p2);
}
```

### Method Length Limits

```typescript
// ❌ TOO LONG (>50 lines)
function veryLongMethod() {
  // 70+ lines of code
  // should be broken into smaller methods
}

// ✅ REFACTORED
function method1() {
  const data = step1();
  const processed = step2(data);
  return step3(processed);
}

private step1() { /* ... */ }
private step2(data) { /* ... */ }
private step3(data) { /* ... */ }
```

---

## ✅ Test Coverage Standards

### Minimum Coverage Requirements

```
Overall: ≥80%
├── Unit Tests: >60% of coverage
├── Integration Tests: >25% of coverage
└── E2E Tests: >15% of coverage
```

### Test File Naming

```
// ✅ CORRECT
src/app/services/user.service.spec.ts
src/app/components/login/login.component.spec.ts

// Test structure
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch users', (done) => {
    service.getUsers().subscribe(users => {
      expect(users.length).toBeGreaterThan(0);
      done();
    });
  });
});
```

---

## 💬 Code Comments & Documentation

### Comment Density Target: 5-10%

```typescript
// ✅ GOOD: Clear, concise comments
/**
 * Validates user input for email format
 * @param email - The email to validate
 * @returns true if valid email format, false otherwise
 * @throws ValidationError if email is null
 */
public isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Explain WHY, not WHAT
// WHAT: User ID is checked
// WHY: To prevent duplicate account creation
if (!this.userExists(userId)) {
  this.createUser(userId);
}
```

### Avoid These Comments

```typescript
// ❌ AVOID: Obvious comments
i++; // increment i
name = 'John'; // set name

// ❌ AVOID: Outdated comments
// TODO: Fix this later (never fixed)
// FIXME: This is broken (left unfixed)
```

---

## 🚀 Performance Standards

### Optimization Requirements

```typescript
// ❌ INEFFICIENT: N+1 Query
items.forEach((item) => {
  const details = database.query('SELECT * WHERE id = ?', item.id);
  process(details);
});

// ✅ OPTIMIZED: Single Query
const details = database.query('SELECT * WHERE id IN ?', itemIds);
items.forEach((item) => {
  process(details[item.id]);
});
```

```typescript
// ❌ INEFFICIENT: Repeated processing
const sorted = data.sort(); // in loop
const filtered = sorted.filter(...); // in loop

// ✅ OPTIMIZED: Process once
const processed = data.sort().filter(...); // once
// Use in loop
```

---

## 📋 Naming Conventions

### Classes

```typescript
// ✅ CORRECT: PascalCase
class UserService {}
class LoginComponent {}
interface AuthToken {}
```

### Functions & Variables

```typescript
// ✅ CORRECT: camelCase
function getUserById(id: string) {}
const isUserActive = true;
let userName = 'John';
```

### Constants

```typescript
// ✅ CORRECT: UPPER_SNAKE_CASE
const MAX_USERS = 100;
const API_ENDPOINT = 'https://api.example.com';
```

---

## 🔍 Running Quality Checks

### Local Checks

```bash
# Run all quality gates
npm run quality:gate

# Security scan
npm run security:scan

# Code metrics
npm run metrics:report

# Lint check
npm run lint

# Tests with coverage
npm run test:ci

# Build
npm run build
```

### GitHub Actions Checks

The following workflows automatically run on PR:

1. **ai-code-review.yml** - AI analysis + scoring
2. **build-test.yml** - Build + tests + coverage
3. **code-quality.yml** - TypeScript + ESLint + security
4. **sonarqube-analysis.yml** - Full SonarQube scan

---

## 📊 PR Score Breakdown

| Item             | Points | Condition            |
| ---------------- | ------ | -------------------- |
| Base Score       | 100    | Starting point       |
| ESLint Pass      | +5     | All checks pass      |
| Tests Pass       | +5     | All tests pass       |
| Bugs Found       | -20    | Per bug              |
| Vulnerabilities  | -25    | Per vulnerability    |
| Code Smells      | -5     | Per 10 issues        |
| Type Safety      | -10    | Per `any` type       |
| Coverage Low     | -15    | Below 80%            |
| Console Logging  | -5     | Per log statement    |
| Complex Method   | -5     | Per method >15       |
| Long Method      | -3     | Per method >50 lines |
| Good Description | +3     | >100 chars           |

**Final Score = Base + Bonuses - Penalties (capped 0-100)**

---

## ✨ Best Practices Checklist

- [ ] Code follows SOLID principles
- [ ] No hardcoded secrets or credentials
- [ ] All functions have JSDoc comments
- [ ] Test coverage ≥80%
- [ ] No console.log in production code
- [ ] No `any` types used
- [ ] Proper error handling with try-catch
- [ ] No code duplication (use helpers)
- [ ] Methods have <50 lines
- [ ] Classes have <200 lines
- [ ] Nesting depth <3 levels
- [ ] Method parameters <4
- [ ] PR title descriptive (10-100 chars)
- [ ] PR description explains what & why
- [ ] Branch follows naming convention
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Linting passes with 0 warnings

---

## 🎯 Grade Mapping

| Score  | Grade | Status                                  |
| ------ | ----- | --------------------------------------- |
| 90-100 | A     | 🟢 Excellent - Merge immediately        |
| 75-89  | B     | 🟡 Good - Minor improvements needed     |
| 60-74  | C     | 🟠 Fair - Significant issues to address |
| 0-59   | D/F   | 🔴 Poor - Rewrite required              |

---

## 📚 Additional Resources

- [SonarQube Docs](https://docs.sonarqube.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Angular Style Guide](https://angular.dev/style-guide)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Code Complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)

---

## 🤖 AI Review Algorithm

**Scoring = 100 + Bonuses - Penalties**

**Approval: Score ≥85 AND Lint ≥90 AND Tests Pass ✓**

For details, see: `LOCAL_AI_PR_TESTING.md`
