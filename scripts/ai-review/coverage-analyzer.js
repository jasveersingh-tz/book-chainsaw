#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Test Coverage Analyzer
 * Checks test coverage for changed files and enforces minimum thresholds
 */

class CoverageAnalyzer {
  constructor() {
    this.thresholds = {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    };
  }

  /**
   * Analyze test coverage
   */
  analyze(changedFiles) {
    const files = changedFiles
      .split(',')
      .filter((f) => f.trim() && f.endsWith('.ts') && !f.includes('.spec.'));

    if (files.length === 0) {
      return {
        passed: true,
        coverage: { statements: 100, branches: 100, functions: 100, lines: 100 },
        message: 'No testable files changed',
        issues: [],
      };
    }

    try {
      // Check if coverage report exists
      const coveragePath = './coverage/coverage-summary.json';

      if (!fs.existsSync(coveragePath)) {
        return {
          passed: false,
          coverage: null,
          message: 'No coverage report found. Run tests with coverage first.',
          issues: [
            {
              severity: 'error',
              message: 'Test coverage data not available. Run: npm run test:ci',
            },
          ],
        };
      }

      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverageData.total;

      const issues = [];
      let passed = true;

      // Check each threshold
      Object.keys(this.thresholds).forEach((metric) => {
        const value = total[metric].pct;
        const threshold = this.thresholds[metric];

        if (value < threshold) {
          passed = false;
          issues.push({
            severity: 'error',
            message: `${metric} coverage (${value.toFixed(1)}%) below threshold (${threshold}%)`,
          });
        }
      });

      // Check coverage for changed files specifically
      files.forEach((file) => {
        const normalizedPath = file.replace(/\\/g, '/');
        const fileCoverage = coverageData[normalizedPath];

        if (!fileCoverage) {
          issues.push({
            severity: 'warning',
            message: `No test coverage found for ${file}. Please add tests.`,
          });
        } else {
          // Check if any metric is below 60% for this specific file
          ['statements', 'branches', 'functions', 'lines'].forEach((metric) => {
            const value = fileCoverage[metric].pct;
            if (value < 60) {
              issues.push({
                severity: 'warning',
                message: `${file}: ${metric} coverage is only ${value.toFixed(1)}%`,
              });
            }
          });
        }
      });

      return {
        passed,
        coverage: {
          statements: total.statements.pct,
          branches: total.branches.pct,
          functions: total.functions.pct,
          lines: total.lines.pct,
        },
        message: passed ? 'Coverage thresholds met' : 'Coverage below thresholds',
        issues,
        changedFilesCount: files.length,
      };
    } catch (error) {
      return {
        passed: false,
        coverage: null,
        message: `Coverage analysis failed: ${error.message}`,
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
   * Check if test files exist for changed source files
   */
  checkTestFiles(changedFiles) {
    const files = changedFiles
      .split(',')
      .filter((f) => f.trim() && f.endsWith('.ts') && !f.includes('.spec.'));
    const missingTests = [];

    files.forEach((file) => {
      const testFile = file.replace('.ts', '.spec.ts');
      if (!fs.existsSync(testFile)) {
        missingTests.push(file);
      }
    });

    if (missingTests.length > 0) {
      return {
        passed: false,
        message: `${missingTests.length} file(s) missing test files`,
        missingTests,
      };
    }

    return {
      passed: true,
      message: 'All changed files have corresponding test files',
    };
  }
}

// Main execution
if (require.main === module) {
  const changedFiles = process.env.CHANGED_FILES || '';

  const analyzer = new CoverageAnalyzer();
  const coverageResult = analyzer.analyze(changedFiles);
  const testFilesResult = analyzer.checkTestFiles(changedFiles);

  const result = {
    coverage: coverageResult,
    testFiles: testFilesResult,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(result, null, 2));

  // Exit with error if coverage fails
  if (!coverageResult.passed) {
    process.exit(1);
  }
}

module.exports = CoverageAnalyzer;
