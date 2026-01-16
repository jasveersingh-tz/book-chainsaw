#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Security Vulnerability Scanner
 * Runs npm audit and checks for known vulnerabilities
 */

class SecurityScanner {
  constructor() {
    this.severityLevels = {
      critical: { weight: 100, threshold: 0 },
      high: { weight: 50, threshold: 0 },
      moderate: { weight: 10, threshold: 3 },
      low: { weight: 5, threshold: 10 },
    };
  }

  /**
   * Run security scan
   */
  scan() {
    try {
      // Run npm audit
      const auditOutput = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const auditData = JSON.parse(auditOutput);
      return this.analyzeAuditResults(auditData);
    } catch (error) {
      // npm audit returns non-zero exit code if vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          return this.analyzeAuditResults(auditData);
        } catch (parseError) {
          return {
            passed: false,
            message: 'Failed to parse npm audit results',
            vulnerabilities: {},
            issues: [
              {
                severity: 'error',
                message: `Audit failed: ${parseError.message}`,
              },
            ],
          };
        }
      }

      return {
        passed: false,
        message: 'npm audit failed to run',
        vulnerabilities: {},
        issues: [
          {
            severity: 'error',
            message: error.message,
          },
        ],
      };
    }
  }

  /**
   * Analyze npm audit results
   */
  analyzeAuditResults(auditData) {
    const vulnerabilities = auditData.metadata?.vulnerabilities || {};
    const issues = [];
    let scoreImpact = 0;
    let passed = true;

    // Check each severity level
    Object.keys(this.severityLevels).forEach((severity) => {
      const count = vulnerabilities[severity] || 0;
      const { weight, threshold } = this.severityLevels[severity];

      if (count > threshold) {
        passed = false;
        const excess = count - threshold;
        scoreImpact += excess * weight;

        issues.push({
          severity: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
          category: 'Security',
          message: `${count} ${severity} vulnerabilit${
            count === 1 ? 'y' : 'ies'
          } found (threshold: ${threshold})`,
        });
      }
    });

    // Check for specific vulnerable packages
    if (auditData.vulnerabilities) {
      Object.entries(auditData.vulnerabilities).forEach(([pkg, data]) => {
        if (data.severity === 'critical' || data.severity === 'high') {
          issues.push({
            severity: 'error',
            category: 'Vulnerable Package',
            message: `${pkg}: ${data.via[0]?.title || 'Security vulnerability'} (${data.severity})`,
          });
        }
      });
    }

    return {
      passed,
      scoreImpact: -scoreImpact,
      vulnerabilities,
      totalVulnerabilities: Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0),
      issues,
      message: passed
        ? 'No critical security vulnerabilities'
        : 'Security vulnerabilities detected',
    };
  }

  /**
   * Check for common security patterns in changed files
   */
  scanFiles(changedFiles) {
    const files = changedFiles.split(',').filter((f) => f.trim());
    const fileIssues = [];

    const securityPatterns = [
      {
        pattern: /process\.env\.\w+\s*\|\|\s*['"]/g,
        message: 'Avoid hardcoded fallback values for environment variables',
        severity: 'warning',
      },
      {
        pattern: /localStorage\.setItem\([^,]+,\s*password/gi,
        message: 'Never store passwords in localStorage - security risk',
        severity: 'error',
      },
      {
        pattern: /atob\(|btoa\(/g,
        message: 'Base64 is encoding, not encryption. Use proper encryption for sensitive data.',
        severity: 'warning',
      },
      {
        pattern: /\.trustAsHtml|trustAsResourceUrl/g,
        message: 'Bypassing Angular security. Ensure data is properly sanitized.',
        severity: 'error',
      },
    ];

    files.forEach((file) => {
      if (!fs.existsSync(file)) return;

      try {
        const content = fs.readFileSync(file, 'utf8');

        securityPatterns.forEach(({ pattern, message, severity }) => {
          if (pattern.test(content)) {
            fileIssues.push({
              severity,
              category: 'Security Pattern',
              file,
              message,
            });
          }
        });
      } catch (error) {
        // Ignore file read errors
      }
    });

    return fileIssues;
  }
}

// Main execution
if (require.main === module) {
  const changedFiles = process.env.CHANGED_FILES || '';

  const scanner = new SecurityScanner();
  const auditResult = scanner.scan();
  const fileIssues = scanner.scanFiles(changedFiles);

  const result = {
    audit: auditResult,
    fileIssues,
    totalIssues: auditResult.issues.length + fileIssues.length,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(result, null, 2));

  // Exit with error if critical vulnerabilities found
  if (!auditResult.passed) {
    process.exit(1);
  }
}

module.exports = SecurityScanner;
