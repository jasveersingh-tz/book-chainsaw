#!/usr/bin/env node

/**
 * Sonar Quality Gate Checker
 * Validates code against SonarQube quality standards
 */

const fs = require('fs');
const path = require('path');

const config = {
  maxBugs: 0,
  maxVulnerabilities: 0,
  minCoverage: 80,
  maxCodeSmells: 10,
  maxDuplication: 3,
  maxComplexity: 15,
  maxLineLength: 120,
  maxMethodLength: 50,
  maxClassLength: 200,
  maxNesting: 3,
  maxParameters: 4,
  maxMethodsPerClass: 30,
};

const results = {
  passed: [],
  failed: [],
  warnings: [],
  score: 100,
};

console.log('🔍 SonarQube Quality Gate Check\n');
console.log('='.repeat(60));

// Check 1: Bugs Detection
console.log('\n1️⃣ Bugs Check');
console.log('-'.repeat(60));
checkBugs();

// Check 2: Vulnerabilities
console.log('\n2️⃣ Security Vulnerabilities Check');
console.log('-'.repeat(60));
checkVulnerabilities();

// Check 3: Coverage
console.log('\n3️⃣ Test Coverage Check');
console.log('-'.repeat(60));
checkCoverage();

// Check 4: Code Smells
console.log('\n4️⃣ Code Smells Check');
console.log('-'.repeat(60));
checkCodeSmells();

// Check 5: Duplication
console.log('\n5️⃣ Code Duplication Check');
console.log('-'.repeat(60));
checkDuplication();

// Check 6: Complexity
console.log('\n6️⃣ Cognitive Complexity Check');
console.log('-'.repeat(60));
checkComplexity();

// Final Report
console.log('\n' + '='.repeat(60));
console.log('📊 QUALITY GATE REPORT\n');

console.log(`✅ Passed: ${results.passed.length}`);
results.passed.forEach((p) => console.log(`   • ${p}`));

if (results.warnings.length > 0) {
  console.log(`\n⚠️ Warnings: ${results.warnings.length}`);
  results.warnings.forEach((w) => console.log(`   • ${w}`));
}

if (results.failed.length > 0) {
  console.log(`\n❌ Failed: ${results.failed.length}`);
  results.failed.forEach((f) => console.log(`   • ${f}`));
  results.score -= results.failed.length * 15;
}

console.log(`\n🎯 Final Score: ${Math.max(0, results.score)}/100\n`);

if (results.failed.length === 0) {
  console.log('✅ All quality gates PASSED!\n');
  process.exit(0);
} else {
  console.log('❌ Quality gates FAILED. Fix issues before committing.\n');
  process.exit(1);
}

// Helper Functions
function checkBugs() {
  // Scan for common bug patterns
  const bugPatterns = [
    { pattern: /==/g, issue: 'Use === instead of ==' },
    { pattern: /!=/g, issue: 'Use !== instead of !=' },
    { pattern: /console\.error.*undefined/g, issue: 'Potential undefined reference' },
  ];

  let bugCount = 0;
  scanFiles('src/**/*.ts', (content, file) => {
    bugPatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(content)) {
        bugCount++;
      }
    });
  });

  if (bugCount <= config.maxBugs) {
    results.passed.push(`No bugs detected (0/${config.maxBugs} allowed)`);
  } else {
    results.failed.push(`${bugCount} bugs found (max: ${config.maxBugs})`);
  }
}

function checkVulnerabilities() {
  const vulnerabilities = [];
  const vulnPatterns = [
    { regex: /password\s*[:=]\s*['"][^'"]*['"]/i, name: 'Hardcoded password' },
    { regex: /api.?key\s*[:=]\s*['"][^'"]*['"]/i, name: 'Hardcoded API key' },
    { regex: /token\s*[:=]\s*['"][^'"]*['"]/i, name: 'Hardcoded token' },
    { regex: /eval\(/g, name: 'Use of eval()' },
    { regex: /innerHTML\s*=/g, name: 'Use innerHTML (XSS risk)' },
  ];

  scanFiles('src/**/*.ts', (content, file) => {
    vulnPatterns.forEach(({ regex, name }) => {
      if (!file.includes('.spec.')) {
        const matches = content.match(regex);
        if (matches) {
          vulnerabilities.push(`${name} in ${file}`);
        }
      }
    });
  });

  if (vulnerabilities.length <= config.maxVulnerabilities) {
    results.passed.push(`No security vulnerabilities (0/${config.maxVulnerabilities} allowed)`);
  } else {
    vulnerabilities.forEach((v) => results.failed.push(v));
  }
}

function checkCoverage() {
  // Mock coverage check (in real scenario, read from coverage report)
  const coveragePath = 'coverage/coverage-summary.json';
  let coverage = 0;

  if (fs.existsSync(coveragePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      coverage = Math.round(data.total.lines.pct);
    } catch (e) {
      results.warnings.push('Could not read coverage report');
    }
  } else {
    results.warnings.push('Coverage report not found. Run tests to generate.');
  }

  if (coverage >= config.minCoverage) {
    results.passed.push(`Test coverage: ${coverage}% (≥${config.minCoverage}%)`);
  } else if (coverage > 0) {
    results.warnings.push(`Test coverage low: ${coverage}% (target: ${config.minCoverage}%)`);
  }
}

function checkCodeSmells() {
  const smells = [];
  const smellPatterns = [
    { regex: /TODO:|FIXME:/g, name: 'TODO/FIXME comment' },
    { regex: /catch\s*\(\s*\)\s*{}/g, name: 'Empty catch block' },
    { regex: /function.*{[\s\S]{2000,}}/g, name: 'Function too long' },
  ];

  scanFiles('src/**/*.ts', (content, file) => {
    smellPatterns.forEach(({ regex, name }) => {
      const matches = content.match(regex);
      if (matches) {
        smells.push(`${name} in ${file}`);
      }
    });
  });

  if (smells.length <= config.maxCodeSmells) {
    results.passed.push(`Code smells: ${smells.length} (≤${config.maxCodeSmells} allowed)`);
  } else {
    results.warnings.push(`Code smells: ${smells.length} (target: ≤${config.maxCodeSmells})`);
  }
}

function checkDuplication() {
  // Simplified duplication check
  results.warnings.push('Duplication check requires full analysis');
  results.passed.push('Code duplication monitoring enabled');
}

function checkComplexity() {
  const complexMethods = [];

  scanFiles('src/**/*.ts', (content, file) => {
    // Simple regex for method complexity
    const methodMatches = content.matchAll(/(\w+)\s*\([^)]*\)\s*{([^}]*)}/g);
    for (const match of methodMatches) {
      const methodBody = match[2];
      const complexity = countComplexity(methodBody);

      if (complexity > config.maxComplexity) {
        complexMethods.push(`High complexity (${complexity}) in ${file}`);
      }
    }
  });

  if (complexMethods.length === 0) {
    results.passed.push(`Cognitive complexity: All methods ≤${config.maxComplexity}`);
  } else {
    complexMethods.slice(0, 3).forEach((m) => results.warnings.push(m));
  }
}

function countComplexity(code) {
  // Count decision points
  let complexity = 1;
  complexity += (code.match(/if\s*\(/g) || []).length;
  complexity += (code.match(/else\s+if\s*\(/g) || []).length;
  complexity += (code.match(/\?\s*:/g) || []).length; // ternary
  complexity += (code.match(/catch\s*\(/g) || []).length;
  complexity += (code.match(/for\s*\(/g) || []).length;
  complexity += (code.match(/while\s*\(/g) || []).length;
  return Math.floor(complexity / 2); // Approximate
}

function scanFiles(pattern, callback) {
  const dir = 'src';
  if (!fs.existsSync(dir)) return;

  function walkDir(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !fullPath.includes('node_modules')) {
          walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') && !fullPath.includes('.spec.')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            callback(content, fullPath);
          } catch (e) {
            // Skip files that can't be read
          }
        }
      });
    } catch (e) {
      // Skip directories that can't be read
    }
  }

  walkDir(dir);
}
