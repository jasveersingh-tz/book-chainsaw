#!/usr/bin/env node

/**
 * Security Scan Script
 * Detects common security vulnerabilities per SonarQube standards
 */

const fs = require('fs');
const path = require('path');

const securityIssues = [];
const securityWarnings = [];
let score = 100;

console.log('🔒 SECURITY SCAN - SonarQube Standards\n');
console.log('='.repeat(70));

const securityRules = [
  {
    name: 'Hardcoded Credentials',
    severity: 'CRITICAL',
    regex: /password\s*[:=]\s*['"][^'"]{1,}['"]/i,
    message: 'Hardcoded password detected',
    penalty: 25,
  },
  {
    name: 'API Keys/Tokens',
    severity: 'CRITICAL',
    regex: /(?:api[_-]?key|secret|token|access[_-]?key)\s*[:=]\s*['"][^'"]{1,}['"]/i,
    message: 'Hardcoded API key or token detected',
    penalty: 25,
  },
  {
    name: 'SQL Injection Risk',
    severity: 'CRITICAL',
    regex: /query\s*\+|concat.*sql/gi,
    message: 'Potential SQL injection vulnerability',
    penalty: 20,
  },
  {
    name: 'XSS Vulnerability',
    severity: 'HIGH',
    regex: /innerHTML\s*=/,
    message: 'Using innerHTML (XSS risk) - use textContent or Angular binding',
    penalty: 15,
  },
  {
    name: 'Eval Usage',
    severity: 'HIGH',
    regex: /eval\s*\(/,
    message: 'Using eval() is dangerous - use Function constructor or alternatives',
    penalty: 15,
  },
  {
    name: 'Console Logging',
    severity: 'MEDIUM',
    regex: /console\.(log|error|warn|debug)\s*\(/,
    message: 'Debug console logging in production code',
    penalty: 5,
    excludeSpec: true,
  },
  {
    name: 'Missing Input Validation',
    severity: 'HIGH',
    regex: /\.value(?!\s*\.)?(?:\s*\|\||===|!==)/,
    message: 'Potential missing input validation',
    penalty: 10,
    excludeSpec: true,
  },
  {
    name: 'Unhandled Promises',
    severity: 'MEDIUM',
    regex: /\.then\s*\([^)]*\)(?!\s*\.catch)/,
    message: 'Promise without .catch() handler',
    penalty: 8,
  },
  {
    name: 'Empty Try-Catch',
    severity: 'HIGH',
    regex: /catch\s*\([^)]*\)\s*{[\s]*}/,
    message: 'Empty catch block - errors will be silently ignored',
    penalty: 12,
  },
  {
    name: 'Type Safety',
    severity: 'HIGH',
    regex: /:\s*any\b/,
    message: 'Using "any" type weakens type safety',
    penalty: 10,
    excludeSpec: false,
  },
  {
    name: 'CSRF Protection',
    severity: 'MEDIUM',
    regex: /fetch\s*\([^)]*POST|PUT|DELETE/i,
    message: 'HTTP requests without CSRF token validation',
    penalty: 8,
  },
  {
    name: 'Secure Headers',
    severity: 'MEDIUM',
    regex: /response\.setHeader\s*\(\s*['"]X-/i,
    message: 'Ensure security headers are properly set',
    penalty: 5,
  },
];

// Scan all TypeScript files
scanTypeScriptFiles();

// Generate report
generateReport();

function scanTypeScriptFiles() {
  const srcDir = 'src';

  function walkDir(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !fullPath.includes('node_modules')) {
          walkDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
          analyzeFile(fullPath);
        }
      });
    } catch (e) {
      // Skip unreadable directories
    }
  }

  if (fs.existsSync(srcDir)) {
    walkDir(srcDir);
  }
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const isSpecFile = filePath.includes('.spec.ts');
    const lines = content.split('\n');

    securityRules.forEach((rule) => {
      // Skip spec files if rule excludes them
      if (isSpecFile && rule.excludeSpec) return;

      // Check for pattern matches
      let lineNum = 1;
      lines.forEach((line) => {
        if (rule.regex.test(line)) {
          const issue = {
            file: filePath,
            line: lineNum,
            rule: rule.name,
            severity: rule.severity,
            message: rule.message,
            code: line.trim().substring(0, 80),
            penalty: rule.penalty,
          };

          if (rule.severity === 'CRITICAL') {
            securityIssues.push(issue);
            score -= rule.penalty;
          } else {
            securityWarnings.push(issue);
            score = Math.max(0, score - rule.penalty / 2);
          }
        }
        lineNum++;
      });
    });
  } catch (e) {
    // Skip files that can't be read
  }
}

function generateReport() {
  console.log('\n📊 SECURITY FINDINGS\n');

  if (securityIssues.length === 0 && securityWarnings.length === 0) {
    console.log('✅ No security issues found!\n');
    console.log('='.repeat(70));
    console.log(`\n🎯 Security Score: ${score}/100\n`);
    process.exit(0);
  }

  // Critical Issues
  if (securityIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Must fix before merge):\n');
    securityIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.rule}`);
      console.log(`   File: ${issue.file}:${issue.line}`);
      console.log(`   Message: ${issue.message}`);
      console.log(`   Code: ${issue.code}`);
      console.log(`   Penalty: -${issue.penalty} points\n`);
    });
  }

  // Warnings
  if (securityWarnings.length > 0) {
    console.log('\n⚠️ WARNINGS (Should be addressed):\n');
    securityWarnings.slice(0, 5).forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning.rule}`);
      console.log(`   File: ${warning.file}:${warning.line}`);
      console.log(`   Message: ${warning.message}\n`);
    });

    if (securityWarnings.length > 5) {
      console.log(`... and ${securityWarnings.length - 5} more warnings\n`);
    }
  }

  // Summary
  console.log('='.repeat(70));
  console.log('\n📈 SECURITY SUMMARY\n');
  console.log(`Total Critical Issues: ${securityIssues.length}`);
  console.log(`Total Warnings: ${securityWarnings.length}`);
  console.log(`Security Score: ${Math.max(0, score)}/100\n`);

  // Recommendations
  console.log('🛡️ RECOMMENDATIONS:\n');
  console.log('1. Fix all CRITICAL issues immediately');
  console.log('2. Address security warnings in the next sprint');
  console.log('3. Implement automated security scanning in CI/CD');
  console.log('4. Use environment variables for sensitive data');
  console.log('5. Enable HTTPS and security headers');
  console.log('6. Implement CSRF protection');
  console.log('7. Use parameterized queries for database access');
  console.log('8. Sanitize user inputs\n');

  console.log('='.repeat(70) + '\n');

  if (securityIssues.length > 0) {
    process.exit(1); // Fail on critical issues
  } else {
    process.exit(0);
  }
}
