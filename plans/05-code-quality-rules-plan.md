# Code Quality Rules Engine - Implementation Plan

## 🎯 Objective

Add **general bug & code smell detection** (SonarQube-style) to PR Guardian, targeting **100+ high-impact rules** focused on common bugs, anti-patterns, and maintainability issues.

**Scope:** Focus on **high-signal rules** that catch real bugs, not stylistic preferences.

---

## 📊 Strategy: Quality over Quantity

Unlike SonarQube's 1000+ rules (many low-value), we'll implement **100-150 critical rules** with:

- **High signal-to-noise ratio** - catches real bugs, not style issues
- **Zero false positives** - configurable thresholds
- **Actionable fixes** - specific recommendations
- **Fast execution** - AST-based, <2s analysis

---

## 🏗️ Architecture

```javascript
// scripts/ai-review/code-quality-analyzer.js

class CodeQualityAnalyzer {
  constructor(config = {}) {
    this.rules = new Map();
    this.severity = config.severity || 'medium';
    this.registerRules();
  }

  registerRules() {
    // Bug Detection Rules
    this.addRule(new NullPointerRule());
    this.addRule(new UndefinedVariableRule());
    this.addRule(new TypeCoercionBugRule());

    // Code Smell Rules
    this.addRule(new ComplexityRule());
    this.addRule(new DuplicateCodeRule());
    this.addRule(new LongFunctionRule());

    // Best Practice Rules
    this.addRule(new AsyncAwaitRule());
    this.addRule(new ErrorHandlingRule());
    this.addRule(new ResourceLeakRule());
  }

  async analyze(files) {
    const issues = [];

    for (const file of files) {
      const ast = await this.parseFile(file);

      for (const [ruleName, rule] of this.rules) {
        if (rule.enabled) {
          const violations = await rule.check(ast, file);
          issues.push(...violations);
        }
      }
    }

    return this.categorizeIssues(issues);
  }
}
```

---

## 📋 Rule Categories

### 1️⃣ **Bug Detection** (40 rules) - CRITICAL

#### Null/Undefined Issues (10 rules)

```javascript
// Rule: NullPointerDereference
// Severity: CRITICAL
const user = getUser(); // may return null
user.name; // ❌ Potential null pointer

// Fix: Add null check
const user = getUser();
if (user) {
  user.name; // ✅ Safe
}
```

**Rules:**

1. **Null Pointer Dereference** - accessing properties on potentially null values
2. **Undefined Variable Access** - using variables before definition
3. **Optional Chaining Missing** - safe navigation not used
4. **Nullish Coalescing Opportunity** - better default value handling
5. **Missing Null Checks** - function parameters not validated
6. **Null Return Inconsistency** - sometimes returns null, sometimes throws
7. **Undefined Array Access** - accessing array[i] without bounds check
8. **Missing Default Values** - destructuring without defaults
9. **Null Propagation** - passing null through call chains
10. **Void Function Usage** - using result of void function

#### Type Safety Issues (8 rules)

```javascript
// Rule: ImplicitTypeCoercion
// Severity: HIGH
if (value == 0) {
} // ❌ Dangerous: "", [], false all match
if (value === 0) {
} // ✅ Explicit

// Rule: LooseComparison
if ('5' == 5) {
} // ❌ true (confusing)
if ('5' === 5) {
} // ✅ false (clear)
```

**Rules:**

1. **Implicit Type Coercion** - == instead of ===
2. **Loose Comparison** - relying on truthy/falsy
3. **parseInt Without Radix** - parseInt("08") = 0 in some engines
4. **NaN Comparison** - using === with NaN (always false)
5. **Array Constructor** - new Array(5) vs new Array(5, 10)
6. **Type Assumption** - assuming types without checking
7. **Mixed Types in Array** - [1, "two", {}] loses type safety
8. **String to Number Coercion** - "5" - 2 = 3 (implicit)

#### Logic Errors (10 rules)

```javascript
// Rule: InfiniteLoop
// Severity: CRITICAL
for (let i = 0; i < 10; i--) {} // ❌ Infinite

// Rule: UnreachableCode
function test() {
  return true;
  console.log('never runs'); // ❌ Dead code
}

// Rule: UselessCondition
if (true) {
} // ❌ Always true
```

**Rules:**

1. **Infinite Loop Detection** - loop counter moves wrong direction
2. **Unreachable Code** - code after return/throw
3. **Duplicate Case** - same switch case twice
4. **Missing Break** - fall-through without comment
5. **Useless Condition** - if(true), while(false)
6. **Contradictory Conditions** - if(x > 5 && x < 3)
7. **Assignment in Condition** - if(x = 5) instead of if(x === 5)
8. **Empty Block** - if() { } with no code
9. **Identical Branches** - if/else with same code
10. **Always False/True** - typeof x === "null" (always false)

#### Async/Promise Issues (12 rules)

```javascript
// Rule: UnhandledPromiseRejection
// Severity: CRITICAL
fetch(url); // ❌ No .catch()

// Rule: FloatingPromise
async function bad() {
  doAsyncWork(); // ❌ Not awaited, errors lost
}

// Rule: PromiseInLoop
for (let i = 0; i < 10; i++) {
  await fetch(url); // ❌ Sequential, should be parallel
}
```

**Rules:**

1. **Unhandled Promise Rejection** - missing .catch() or try/catch
2. **Floating Promise** - async call not awaited
3. **Promise in Loop** - sequential instead of Promise.all()
4. **Missing Await** - async function result ignored
5. **Async Without Error Handling** - no try/catch in async
6. **Promise Constructor Misuse** - unnecessary new Promise()
7. **Callback Hell** - 3+ nested callbacks (use async/await)
8. **Mixed Promise Patterns** - .then() and await mixed
9. **Promise Race Condition** - parallel mutations
10. **Async in Constructor** - constructors can't be async
11. **Fire and Forget** - background tasks without tracking
12. **Promise.all Without Error Handling** - one failure kills all

---

### 2️⃣ **Code Smells** (30 rules) - HIGH

#### Complexity (8 rules)

```javascript
// Rule: CognitiveComplexity
// Threshold: 15
function complex() {
  if (a) {
    if (b) {
      if (c) {
        for (let i = 0; i < 10; i++) {
          if (d) {
            // Cognitive complexity = 6
          }
        }
      }
    }
  }
}

// Rule: CyclomaticComplexity
// Threshold: 10
function manyPaths() {
  if (a) return 1;
  if (b) return 2;
  if (c) return 3;
  // ... 10+ branches = hard to test
}
```

**Rules:**

1. **Cognitive Complexity** - nested conditions/loops (threshold: 15)
2. **Cyclomatic Complexity** - number of paths (threshold: 10)
3. **Function Length** - lines of code (threshold: 50)
4. **Parameter Count** - too many params (threshold: 5)
5. **Nested Depth** - deeply nested blocks (threshold: 4)
6. **Class Length** - too large classes (threshold: 300 lines)
7. **File Length** - too large files (threshold: 500 lines)
8. **Expression Complexity** - complex ternaries/expressions

#### Duplication (5 rules)

```javascript
// Rule: DuplicateCode
// Threshold: 6+ identical lines
function a() {
  const x = getData();
  const y = process(x);
  return format(y);
}
function b() {
  const x = getData();
  const y = process(x);
  return format(y);
} // ❌ Extract to shared function

// Rule: MagicNumbers
const tax = price * 0.08; // ❌ What is 0.08?
const TAX_RATE = 0.08;
const tax = price * TAX_RATE; // ✅ Clear
```

**Rules:**

1. **Duplicate Code Blocks** - 6+ identical lines
2. **Similar Functions** - 80%+ similarity
3. **Copy-Paste Code** - repeated patterns
4. **Magic Numbers** - unexplained constants
5. **Magic Strings** - hardcoded strings used multiple times

#### Naming & Readability (10 rules)

```javascript
// Rule: UnclearVariableName
let x = getUserData(); // ❌ What is x?
let userData = getUserData(); // ✅ Clear

// Rule: InconsistentNaming
const user_name = 'John'; // snake_case
const userId = 123; // camelCase
// ❌ Pick one convention

// Rule: AbbreviationOveruse
const usrMgr = new UsrMgr(); // ❌ Unclear
const userManager = new UserManager(); // ✅ Clear
```

**Rules:**

1. **Unclear Variable Names** - x, temp, data (too generic)
2. **Inconsistent Naming** - camelCase vs snake_case mixed
3. **Abbreviation Overuse** - mgr, usr, btn (spell out)
4. **Boolean Naming** - should be is/has/can prefix
5. **Function Naming** - should be verbs (get, set, calculate)
6. **Class Naming** - should be nouns (User, Manager)
7. **Constant Naming** - should be UPPER_SNAKE_CASE
8. **Negated Boolean Names** - isNotValid (use isValid)
9. **Hungarian Notation** - strName, arrItems (outdated)
10. **Single Letter Names** - except loop indices

#### Design Issues (7 rules)

```javascript
// Rule: GodObject
class UserManager {
  createUser() {}
  deleteUser() {}
  sendEmail() {} // ❌ Email not user concern
  validatePayment() {} // ❌ Payment not user concern
  generateReport() {} // ❌ Report not user concern
} // ❌ Too many responsibilities

// Rule: DeepInheritance
class A {}
class B extends A {}
class C extends B {}
class D extends C {}
class E extends D {} // ❌ 5 levels deep
```

**Rules:**

1. **God Object** - class with 10+ methods/properties
2. **Deep Inheritance** - 3+ levels of inheritance
3. **Feature Envy** - method uses another class's data heavily
4. **Inappropriate Intimacy** - classes accessing each other's internals
5. **Primitive Obsession** - using primitives instead of objects
6. **Data Class** - class with only getters/setters
7. **Refused Bequest** - subclass doesn't use parent methods

---

### 3️⃣ **Best Practices** (40 rules) - MEDIUM

#### Error Handling (10 rules)

```javascript
// Rule: EmptyCatchBlock
try {
  riskyOperation();
} catch (e) {} // ❌ Swallowing errors

// Rule: GenericCatch
try {
  riskyOperation();
} catch (e) {
  console.log('Error'); // ❌ No context
}

// Rule: ThrowingPrimitive
throw 'error'; // ❌ Throw Error objects
throw new Error('Descriptive message'); // ✅
```

**Rules:**

1. **Empty Catch Block** - catch without handling
2. **Generic Error Messages** - "Error" without context
3. **Throwing Primitives** - throw "string" instead of Error
4. **Missing Finally** - resources not cleaned up
5. **Catching All Errors** - catch() without rethrowing critical
6. **Error Lost in Chain** - promise chain loses error info
7. **No Stack Trace** - errors without proper stack
8. **Silent Failures** - returning null instead of throwing
9. **Overly Broad Catch** - catch(Exception) instead of specific
10. **Throwing in Finally** - masks original error

#### Resource Management (8 rules)

```javascript
// Rule: UnclosedResource
const file = fs.openSync('file.txt'); // ❌ Never closed

// Rule: LeakedEventListener
element.addEventListener('click', handler); // ❌ Never removed

// Rule: IntervalNotCleared
setInterval(() => {}, 1000); // ❌ Runs forever
```

**Rules:**

1. **Unclosed File/Stream** - fs.open() without close()
2. **Leaked Event Listener** - addEventListener without removal
3. **Interval Not Cleared** - setInterval without clearInterval
4. **Timeout Not Cleared** - setTimeout without cleanup
5. **DB Connection Leak** - connection not returned to pool
6. **Memory Leak Patterns** - global variables growing unbounded
7. **Closure Memory Leak** - closures holding large objects
8. **Detached DOM Nodes** - references preventing GC

#### Security (12 rules)

```javascript
// Rule: SqlInjection
const query = `SELECT * FROM users WHERE id = ${userId}`; // ❌
const query = 'SELECT * FROM users WHERE id = ?'; // ✅ Parameterized

// Rule: XssVulnerability
element.innerHTML = userInput; // ❌ XSS risk
element.textContent = userInput; // ✅ Safe

// Rule: HardcodedCredentials
const password = 'admin123'; // ❌ Never hardcode
```

**Rules:**

1. **SQL Injection** - string concatenation in queries
2. **XSS Vulnerability** - innerHTML with user input
3. **Hardcoded Credentials** - passwords/keys in code
4. **Insecure Random** - Math.random() for crypto
5. **Path Traversal** - user input in file paths
6. **Command Injection** - exec() with user input
7. **Regex DoS** - catastrophic backtracking patterns
8. **Prototype Pollution** - Object.assign with user data
9. **Eval Usage** - eval(), Function() constructor
10. **Insecure Deserialization** - JSON.parse untrusted data
11. **Missing Input Validation** - accepting any user input
12. **CORS Misconfiguration** - Access-Control-Allow-Origin: \*

#### Performance (10 rules)

```javascript
// Rule: SynchronousFileIO
const data = fs.readFileSync('large.json'); // ❌ Blocks
const data = await fs.promises.readFile('large.json'); // ✅

// Rule: RegexInLoop
for (let item of items) {
  /pattern/.test(item); // ❌ Regex created each iteration
}
const regex = /pattern/;
for (let item of items) {
  regex.test(item); // ✅ Reuse
}
```

**Rules:**

1. **Synchronous I/O** - blocking file/network operations
2. **Regex in Loop** - compile once, reuse
3. **Function Creation in Loop** - creates new function each time
4. **Unnecessary Array Copy** - slice() when not needed
5. **Inefficient Array Methods** - filter().map() (use reduce)
6. **Large Object in Loop** - creating large objects repeatedly
7. **Premature Optimization** - complex code for marginal gain
8. **Memory Allocation Pattern** - allocating in hot path
9. **Blocking Event Loop** - long synchronous operations
10. **Inefficient Recursion** - missing memoization

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Rule engine infrastructure

```javascript
// Base rule interface
class Rule {
  constructor(config) {
    this.id = config.id;
    this.severity = config.severity; // critical/high/medium/low
    this.category = config.category;
    this.enabled = config.enabled ?? true;
  }

  async check(ast, file) {
    // Returns array of violations
    throw new Error('Must implement check()');
  }

  getFixSuggestion(violation) {
    return null; // Optional auto-fix
  }
}

// Example implementation
class NullPointerRule extends Rule {
  constructor() {
    super({
      id: 'null-pointer-dereference',
      severity: 'critical',
      category: 'bugs',
      message: 'Potential null pointer dereference',
    });
  }

  async check(ast, file) {
    const violations = [];

    traverse(ast, {
      MemberExpression(path) {
        const object = path.node.object;

        if (this.mayBeNull(object)) {
          violations.push({
            rule: this.id,
            severity: this.severity,
            file: file,
            line: path.node.loc.start.line,
            message: `${object.name} may be null`,
            suggestion: `Add null check: if (${object.name}) { ... }`,
          });
        }
      },
    });

    return violations;
  }
}
```

**Deliverables:**

- ✅ `Rule` base class
- ✅ `RuleEngine` orchestrator
- ✅ AST traversal utilities
- ✅ Violation reporting format

---

### Phase 2: Bug Detection (Week 2-3)

**Goal:** 40 critical bug-catching rules

**Priority Rules:**

1. Null pointer dereference
2. Undefined variable access
3. Infinite loop detection
4. Unhandled promise rejection
5. Type coercion bugs
6. Assignment in condition
7. Unreachable code
8. Floating promises
9. Async without error handling
10. Resource leaks

**Testing:**

- Create test suite with 200+ bug samples
- Validate 95%+ detection rate
- Ensure <5% false positives

---

### Phase 3: Code Smells (Week 4)

**Goal:** 30 maintainability rules

**Priority Rules:**

1. Cognitive complexity
2. Duplicate code
3. Magic numbers/strings
4. God objects
5. Function length
6. Parameter count
7. Unclear naming
8. Deep nesting
9. Cyclomatic complexity
10. Similar functions

**Thresholds (configurable):**

```javascript
// .pr-guardian.json
{
  "rules": {
    "cognitive-complexity": { "max": 15 },
    "function-length": { "max": 50 },
    "parameter-count": { "max": 5 },
    "duplicate-lines": { "min": 6 },
    "cyclomatic-complexity": { "max": 10 }
  }
}
```

---

### Phase 4: Best Practices (Week 5)

**Goal:** 40 security & performance rules

**Security (12 rules):**

- SQL injection patterns
- XSS vulnerabilities
- Hardcoded credentials
- Insecure random
- Path traversal
- Command injection

**Performance (10 rules):**

- Synchronous I/O
- Regex in loops
- Function creation in loops
- Inefficient array methods
- Blocking operations

**Error Handling (10 rules):**

- Empty catch blocks
- Generic error messages
- Missing finally blocks
- Silent failures

**Resource Management (8 rules):**

- Unclosed resources
- Event listener leaks
- Interval/timeout cleanup
- Memory leak patterns

---

### Phase 5: Integration (Week 6)

**Goal:** Integrate with PR Guardian

```javascript
// pr-guardian.js - updated
const analyzers = [
  new DependencyGraphAnalyzer(),
  new CallGraphAnalyzer(),
  new ContractVerifier(),
  new StateMutationTracker(),
  new PerformanceAnalyzer(),
  new CodeQualityAnalyzer(), // NEW
  new MergeDecisionEngine(),
];

const results = await Promise.all(analyzers.map((a) => a.analyze(changedFiles)));

// Merge decision considers code quality issues
const decision = decisionEngine.decide({
  ...existingIssues,
  codeQuality: results.codeQuality,
});
```

**Decision Thresholds:**

```javascript
// BLOCK merge if:
- criticalBugs > 0 (null pointers, infinite loops)
- highSeverityBugs > 3
- sqlInjection || xss || hardcodedCredentials

// WARN if:
- highSeverityBugs > 0
- mediumSeverityBugs > 5
- cognitiveComplexity > 20

// APPROVE if:
- criticalBugs === 0
- highSeverityBugs <= 3
- all security checks pass
```

---

## 📊 Success Metrics

### Detection Rates

- **Bug Detection:** 95%+ accuracy
- **False Positives:** <5%
- **Security Issues:** 99%+ detection (SQL injection, XSS)
- **Code Smells:** 90%+ detection

### Performance

- **Analysis Time:** <3 seconds for 100 files
- **Rule Execution:** <30ms per rule per file
- **Memory Usage:** <200MB for large projects

### Impact

- **Bugs Caught:** 80%+ before merge
- **Security Issues:** 100% critical vulnerabilities blocked
- **Code Quality:** 50% reduction in complexity violations
- **Developer Productivity:** No false positive fatigue

---

## 🎯 Configuration

```javascript
// .pr-guardian.json
{
  "codeQuality": {
    "enabled": true,

    "rules": {
      // Enable/disable categories
      "bugs": true,
      "codeSmells": true,
      "security": true,
      "performance": true,

      // Specific rule overrides
      "null-pointer-dereference": { "enabled": true, "severity": "critical" },
      "cognitive-complexity": { "enabled": true, "max": 15 },
      "magic-numbers": { "enabled": true, "ignore": [0, 1, -1] },
      "function-length": { "enabled": true, "max": 50 },

      // Disable specific rules
      "abbreviation-overuse": { "enabled": false }
    },

    // File exclusions
    "exclude": [
      "**/*.spec.ts",
      "**/*.test.js",
      "**/migrations/**",
      "**/generated/**"
    ],

    // Merge thresholds
    "thresholds": {
      "criticalBugs": 0,
      "highBugs": 3,
      "mediumBugs": 10,
      "maxComplexity": 20
    }
  }
}
```

---

## 💡 Competitive Edge

### vs SonarQube

| Feature         | SonarQube                 | PR Guardian          |
| --------------- | ------------------------- | -------------------- |
| Rules Count     | 1000+                     | 100-150              |
| Signal/Noise    | Medium (many style rules) | **High (bugs only)** |
| Speed           | 60-180s                   | **<3s**              |
| False Positives | 10-20%                    | **<5%**              |
| Integration     | Server required           | **CLI, instant**     |
| Cost            | $150-15K/year             | **Free**             |

### vs ESLint

| Feature             | ESLint  | PR Guardian                 |
| ------------------- | ------- | --------------------------- |
| Scope               | Linting | **Bugs + breaking changes** |
| Dependency Tracking | ❌      | **✅**                      |
| Impact Analysis     | ❌      | **✅**                      |
| AST Analysis        | ✅      | ✅                          |
| Auto-fix            | ✅      | Partial                     |

**Positioning:** PR Guardian = ESLint rules + SonarQube bugs + dependency analysis

---

## 🚀 Next Steps

1. **Week 1-6:** Implement 100+ rules following phase plan
2. **Week 7:** Performance optimization (<3s for 100 files)
3. **Week 8:** Documentation + configuration guide
4. **Week 9:** Integration testing with real projects
5. **Week 10:** NPM package release as v2.0

**Result:** Most comprehensive PR protection tool with:

- Breaking change detection (unique)
- Bug detection (SonarQube-level)
- Code smells (maintainability)
- Security scanning (OWASP)
- Performance analysis (framework-specific)
- 100x faster than alternatives
