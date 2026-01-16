#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Advanced Code Analyzer for AI PR Review
 * Analyzes code quality, security, complexity, and patterns
 */

class CodeAnalyzer {
  constructor() {
    this.issues = [];
    this.score = 100;
    this.metrics = {
      filesAnalyzed: 0,
      linesAnalyzed: 0,
      criticalIssues: 0,
      warnings: 0,
      infos: 0,
    };
  }

  /**
   * Analyze changed files
   */
  analyzeFiles(changedFiles) {
    const files = changedFiles.split(',').filter((f) => f.trim());

    files.forEach((file) => {
      if (!file || !fs.existsSync(file)) return;

      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        this.metrics.filesAnalyzed++;
        this.metrics.linesAnalyzed += lines.length;

        // Run all analysis checks
        this.checkTypeScript(file, content, lines);
        this.checkSecurity(file, content);
        this.checkComplexity(file, content, lines);
        this.checkCodeSmells(file, content);
        this.checkBestPractices(file, content);
        this.checkPerformance(file, content);
        this.checkDuplication(file, content);
      } catch (error) {
        console.error(`Error analyzing ${file}:`, error.message);
      }
    });

    return this.generateReport();
  }

  /**
   * TypeScript-specific checks
   */
  checkTypeScript(file, content, lines) {
    if (!file.endsWith('.ts')) return;

    // Check for 'any' types
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches) {
      this.addIssue(
        'error',
        'Type Safety',
        file,
        `Found ${anyMatches.length} usage(s) of 'any' type. Use explicit types for type safety.`
      );
      this.score -= anyMatches.length * 10;
    }

    // Check for explicit return types on functions
    const functionWithoutReturn = content.match(
      /(?:public|private|protected)?\s+\w+\s*\([^)]*\)\s*{/g
    );
    const functionWithReturn = content.match(
      /(?:public|private|protected)?\s+\w+\s*\([^)]*\)\s*:\s*\w+/g
    );

    if (
      functionWithoutReturn &&
      (!functionWithReturn || functionWithoutReturn.length > functionWithReturn.length)
    ) {
      this.addIssue(
        'warning',
        'Type Safety',
        file,
        'Some functions missing explicit return types. Add return types for clarity.'
      );
      this.score -= 5;
    }

    // Check for proper null/undefined handling
    if (content.includes('!.') || content.includes('! ')) {
      this.addIssue(
        'warning',
        'Type Safety',
        file,
        'Non-null assertion operator (!) detected. Prefer optional chaining (?.) or proper null checks.'
      );
      this.score -= 5;
    }

    // Check for unused imports
    const imports = content.match(/import\s+{([^}]+)}\s+from/g);
    if (imports) {
      imports.forEach((imp) => {
        const imported = imp
          .match(/{\s*([^}]+)\s*}/)[1]
          .split(',')
          .map((i) => i.trim());
        imported.forEach((item) => {
          const regex = new RegExp(`\\b${item}\\b`, 'g');
          const matches = content.match(regex);
          if (!matches || matches.length <= 1) {
            this.addIssue('info', 'Code Cleanup', file, `Unused import detected: ${item}`);
            this.score -= 2;
          }
        });
      });
    }
  }

  /**
   * Security vulnerability checks
   */
  checkSecurity(file, content) {
    const securityPatterns = [
      {
        pattern: /password\s*[:=]\s*['"][^'"]{3,}['"]/gi,
        message: 'Hardcoded password detected. Use environment variables.',
        severity: 'error',
        scoreImpact: -25,
      },
      {
        pattern: /api[-_]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi,
        message: 'Hardcoded API key detected. Use environment variables.',
        severity: 'error',
        scoreImpact: -25,
      },
      {
        pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/gi,
        message: 'Hardcoded token detected. Use secure storage.',
        severity: 'error',
        scoreImpact: -25,
      },
      {
        pattern: /eval\s*\(/g,
        message: 'eval() usage detected. Severe security risk - avoid at all costs.',
        severity: 'error',
        scoreImpact: -30,
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'innerHTML usage detected. XSS risk - use textContent or sanitize input.',
        severity: 'error',
        scoreImpact: -20,
      },
      {
        pattern: /dangerouslySetInnerHTML/g,
        message: 'dangerouslySetInnerHTML usage. Ensure input is properly sanitized.',
        severity: 'warning',
        scoreImpact: -10,
      },
      {
        pattern: /document\.write\(/g,
        message: 'document.write() usage. Prefer modern DOM manipulation.',
        severity: 'warning',
        scoreImpact: -10,
      },
    ];

    securityPatterns.forEach(({ pattern, message, severity, scoreImpact }) => {
      if (pattern.test(content)) {
        this.addIssue(severity, 'Security', file, message);
        this.score += scoreImpact;
      }
    });

    // Check for SQL injection patterns (if using raw queries)
    if (content.includes('SELECT') && content.includes('${')) {
      this.addIssue(
        'error',
        'Security',
        file,
        'Possible SQL injection vulnerability. Use parameterized queries.'
      );
      this.score -= 25;
    }

    // Check for insecure random number generation
    if (
      content.includes('Math.random()') &&
      (content.includes('crypto') || content.includes('security'))
    ) {
      this.addIssue(
        'warning',
        'Security',
        file,
        'Math.random() is not cryptographically secure. Use crypto.randomBytes() for security purposes.'
      );
      this.score -= 10;
    }
  }

  /**
   * Code complexity analysis
   */
  checkComplexity(file, content, lines) {
    if (!file.endsWith('.ts')) return;

    // Calculate cyclomatic complexity for each function
    const functionRegex = /(?:public|private|protected)?\s+(\w+)\s*\([^)]*\)\s*{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const functionStart = match.index;
      const functionName = match[1];

      // Find function end (simple bracket matching)
      let bracketCount = 1;
      let functionEnd = functionStart + match[0].length;

      for (let i = functionEnd; i < content.length && bracketCount > 0; i++) {
        if (content[i] === '{') bracketCount++;
        if (content[i] === '}') bracketCount--;
        if (bracketCount === 0) functionEnd = i;
      }

      const functionBody = content.substring(functionStart, functionEnd);

      // Calculate complexity (decision points)
      const complexity =
        1 +
        (functionBody.match(/if\s*\(/g) || []).length +
        (functionBody.match(/else\s+if\s*\(/g) || []).length +
        (functionBody.match(/for\s*\(/g) || []).length +
        (functionBody.match(/while\s*\(/g) || []).length +
        (functionBody.match(/case\s+/g) || []).length +
        (functionBody.match(/\?\s*.*:\s*/g) || []).length +
        (functionBody.match(/&&|\|\|/g) || []).length;

      if (complexity > 15) {
        this.addIssue(
          'error',
          'Complexity',
          file,
          `Function '${functionName}' has cyclomatic complexity of ${complexity} (max: 15). Refactor to reduce complexity.`
        );
        this.score -= 15;
      } else if (complexity > 10) {
        this.addIssue(
          'warning',
          'Complexity',
          file,
          `Function '${functionName}' has cyclomatic complexity of ${complexity} (max: 10). Consider refactoring.`
        );
        this.score -= 8;
      }

      // Check function length
      const functionLines = functionBody.split('\n').length;
      if (functionLines > 50) {
        this.addIssue(
          'warning',
          'Complexity',
          file,
          `Function '${functionName}' has ${functionLines} lines (max: 50). Split into smaller functions.`
        );
        this.score -= 5;
      }
    }

    // Check file length
    if (lines.length > 500) {
      this.addIssue(
        'warning',
        'File Size',
        file,
        `File has ${lines.length} lines (recommended max: 500). Consider splitting into multiple files.`
      );
      this.score -= 5;
    }
  }

  /**
   * Code smell detection
   */
  checkCodeSmells(file, content) {
    // Check for console statements in production code
    if (file.endsWith('.ts') && !file.includes('.spec.')) {
      const consoleMatches = content.match(/console\.(log|debug|info)\(/g);
      if (consoleMatches) {
        this.addIssue(
          'warning',
          'Code Cleanup',
          file,
          `Found ${consoleMatches.length} console statement(s). Remove or replace with proper logging.`
        );
        this.score -= consoleMatches.length * 3;
      }
    }

    // Check for TODO/FIXME comments
    const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi);
    if (todoMatches) {
      this.addIssue(
        'warning',
        'Technical Debt',
        file,
        `Found ${todoMatches.length} TODO/FIXME comment(s). Address before merging or create issues.`
      );
      this.score -= todoMatches.length * 2;
    }

    // Check for magic numbers
    const magicNumbers = content.match(/\b\d{3,}\b/g);
    if (magicNumbers && magicNumbers.length > 3) {
      this.addIssue(
        'info',
        'Maintainability',
        file,
        'Multiple magic numbers detected. Consider using named constants.'
      );
      this.score -= 3;
    }

    // Check for deeply nested code
    const nestedBrackets = content.match(/{[^{}]*{[^{}]*{[^{}]*{/g);
    if (nestedBrackets) {
      this.addIssue(
        'warning',
        'Complexity',
        file,
        'Deeply nested code detected (4+ levels). Consider extracting methods.'
      );
      this.score -= 8;
    }

    // Check for commented-out code
    const commentedCode = content.match(/\/\/\s*[a-z]+\s*\([^)]*\)\s*{/gi);
    if (commentedCode && commentedCode.length > 2) {
      this.addIssue(
        'info',
        'Code Cleanup',
        file,
        'Commented-out code detected. Remove dead code or use version control.'
      );
      this.score -= 3;
    }
  }

  /**
   * Best practices checks
   */
  checkBestPractices(file, content) {
    if (!file.endsWith('.ts')) return;

    // Check for proper error handling
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;

    if (tryBlocks !== catchBlocks) {
      this.addIssue(
        'error',
        'Error Handling',
        file,
        'Mismatched try-catch blocks. Ensure proper error handling.'
      );
      this.score -= 10;
    }

    // Check for empty catch blocks
    if (content.includes('catch') && content.match(/catch\s*\([^)]*\)\s*{\s*}/)) {
      this.addIssue(
        'warning',
        'Error Handling',
        file,
        'Empty catch block detected. Handle errors properly or rethrow.'
      );
      this.score -= 8;
    }

    // Check for promise chains instead of async/await
    const promiseChains = content.match(/\.then\([^)]*\)\s*\.then\(/g);
    if (promiseChains) {
      this.addIssue(
        'info',
        'Code Style',
        file,
        'Long promise chains detected. Consider using async/await for better readability.'
      );
      this.score -= 2;
    }

    // Check for proper Angular lifecycle hooks
    if (content.includes('implements OnInit') && !content.includes('ngOnInit()')) {
      this.addIssue(
        'error',
        'Angular',
        file,
        'Component implements OnInit but missing ngOnInit() method.'
      );
      this.score -= 15;
    }

    // Check for unsubscribed observables
    if (
      content.includes('.subscribe(') &&
      !content.includes('ngOnDestroy') &&
      !content.includes('async')
    ) {
      this.addIssue(
        'warning',
        'Memory Leak',
        file,
        'Observable subscription without unsubscribe. Consider using async pipe or implement ngOnDestroy.'
      );
      this.score -= 10;
    }
  }

  /**
   * Performance checks
   */
  checkPerformance(file, content) {
    // Check for inefficient loops
    if (content.includes('for') && content.includes('forEach')) {
      const nestedLoops = content.match(/for[^{]*{[^}]*for[^{]*{/g);
      if (nestedLoops) {
        this.addIssue(
          'warning',
          'Performance',
          file,
          'Nested loops detected. Review for O(n²) complexity and consider optimization.'
        );
        this.score -= 5;
      }
    }

    // Check for synchronous operations in async contexts
    if (content.includes('async') && content.match(/fs\.readFileSync|fs\.writeFileSync/)) {
      this.addIssue(
        'warning',
        'Performance',
        file,
        'Synchronous file operations in async function. Use async variants.'
      );
      this.score -= 8;
    }

    // Check for large inline arrays/objects
    const largeInlineData = content.match(/\[[^\]]{200,}\]/g);
    if (largeInlineData) {
      this.addIssue(
        'info',
        'Performance',
        file,
        'Large inline data structures detected. Consider moving to separate files or lazy loading.'
      );
      this.score -= 3;
    }
  }

  /**
   * Check for code duplication
   */
  checkDuplication(file, content) {
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('//'));

    // Simple duplication check - look for repeated blocks of 5+ lines
    const blocks = [];
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n');
      if (blocks.includes(block)) {
        this.addIssue(
          'warning',
          'Duplication',
          file,
          'Code duplication detected. Consider extracting to reusable function.'
        );
        this.score -= 10;
        break;
      }
      blocks.push(block);
    }
  }

  /**
   * Add an issue to the report
   */
  addIssue(severity, category, file, message) {
    this.issues.push({ severity, category, file, message });

    if (severity === 'error') this.metrics.criticalIssues++;
    else if (severity === 'warning') this.metrics.warnings++;
    else this.metrics.infos++;
  }

  /**
   * Generate final report
   */
  generateReport() {
    return {
      score: Math.max(0, Math.min(100, Math.round(this.score))),
      issues: this.issues,
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
    };
  }
}

// Main execution
if (require.main === module) {
  const changedFiles = process.env.CHANGED_FILES || '';

  if (!changedFiles) {
    console.log(JSON.stringify({ score: 100, issues: [], metrics: {} }));
    process.exit(0);
  }

  const analyzer = new CodeAnalyzer();
  const report = analyzer.analyzeFiles(changedFiles);

  console.log(JSON.stringify(report, null, 2));

  // Exit with error code if critical issues found
  if (report.score < 60) {
    process.exit(1);
  }
}

module.exports = CodeAnalyzer;
