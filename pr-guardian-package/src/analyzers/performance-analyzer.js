/**
 * Performance Analyzer
 * Detects performance regressions and anti-patterns
 */
class PerformanceAnalyzer {
  constructor() {
    this.antiPatterns = [];
  }

  /**
   * Analyze performance issues
   */
  async analyze(files, fileContents) {
    console.log(`Analyzing performance for ${files.length} files...`);

    for (const file of files) {
      const content = fileContents.get(file) || '';
      const issues = this.detectAntiPatterns(content, file);
      this.antiPatterns.push(...issues);
    }

    return this.antiPatterns;
  }

  /**
   * Detect performance anti-patterns
   */
  detectAntiPatterns(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    // Angular-specific patterns
    const patterns = [
      {
        name: 'MISSING_TRACK_BY',
        regex: /\*ngFor="let\s+\w+\s+of\s+[^"]*"(?![^<]*trackBy)/,
        severity: 'WARNING',
        impact: 'Causes full DOM re-render on data changes',
        suggestion: 'Add trackBy function to ngFor directive',
      },
      {
        name: 'UNSUBSCRIBED_OBSERVABLE',
        regex: /\.subscribe\([^)]*\)(?!.*takeUntil|.*take\(|.*first\()/,
        severity: 'ERROR',
        impact: 'Memory leak - observable not unsubscribed',
        suggestion: 'Add unsubscribe logic in ngOnDestroy or use takeUntil operator',
      },
      {
        name: 'NESTED_LOOP',
        regex: /for\s*\([^)]*\)\s*{[^}]*for\s*\(/,
        severity: 'WARNING',
        impact: 'O(n²) complexity - potential performance bottleneck',
        suggestion: 'Consider using Map/Set for lookups or optimize algorithm',
      },
      {
        name: 'INLINE_FUNCTION',
        regex: /\[(\w+)\]="[^"]*=>/,
        severity: 'WARNING',
        impact: 'Creates new function on every change detection cycle',
        suggestion: 'Move function to component class',
      },
      {
        name: 'SYNCHRONOUS_LOOP_API',
        regex: /for\s*\([^)]*\)\s*{[^}]*(?:http\.|fetch\(|axios\.)/,
        severity: 'ERROR',
        impact: 'Synchronous loop with async operations - blocks UI',
        suggestion: 'Use Promise.all() or forkJoin() for parallel execution',
      },
      {
        name: 'DEEP_CLONE_IN_LOOP',
        regex: /for\s*\([^)]*\)\s*{[^}]*JSON\.(?:parse|stringify)/,
        severity: 'WARNING',
        impact: 'Expensive deep clone operation in loop',
        suggestion: 'Move clone operation outside loop if possible',
      },
      {
        name: 'LARGE_BUNDLE_IMPORT',
        regex: /import\s+.*\s+from\s+['"]lodash['"]/,
        severity: 'INFO',
        impact: 'Importing entire lodash library increases bundle size',
        suggestion: 'Use specific imports: import { method } from "lodash/method"',
      },
      {
        name: 'NO_CHANGE_DETECTION_STRATEGY',
        regex: /@Component\s*\([^)]*\)(?![^{]*changeDetection)/,
        severity: 'INFO',
        impact: 'Default change detection strategy - may impact performance',
        suggestion: 'Consider using ChangeDetectionStrategy.OnPush',
      },
    ];

    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            pattern: pattern.name,
            file: filePath,
            line: index + 1,
            code: line.trim(),
            severity: pattern.severity,
            impact: pattern.impact,
            suggestion: pattern.suggestion,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Calculate complexity score
   */
  calculateComplexity(content) {
    const metrics = {
      cyclomaticComplexity: 1, // Base complexity
      cognitiveComplexity: 0,
      nestingDepth: 0,
    };

    // Count control flow statements
    const controlFlow = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
    ];

    for (const regex of controlFlow) {
      const matches = content.match(regex);
      if (matches) {
        metrics.cyclomaticComplexity += matches.length;
      }
    }

    // Calculate nesting depth
    let currentDepth = 0;
    let maxDepth = 0;
    for (const char of content) {
      if (char === '{') currentDepth++;
      if (char === '}') currentDepth--;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    metrics.nestingDepth = maxDepth;

    return metrics;
  }

  /**
   * Estimate bundle size impact
   */
  estimateBundleImpact(changedFiles, fileContents) {
    let totalSize = 0;
    const largeFiles = [];

    for (const file of changedFiles) {
      const content = fileContents.get(file) || '';
      const size = Buffer.byteLength(content, 'utf8');
      totalSize += size;

      if (size > 50000) {
        // Files > 50KB
        largeFiles.push({
          file,
          size: `${(size / 1024).toFixed(2)} KB`,
          warning: size > 100000 ? 'Very large file' : 'Large file',
        });
      }
    }

    return {
      estimatedSizeDelta: `${(totalSize / 1024).toFixed(2)} KB`,
      largeFiles,
      threshold: '100 KB',
      exceeds: totalSize > 100000,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(changedFiles, fileContents) {
    const errors = this.antiPatterns.filter((p) => p.severity === 'ERROR').length;
    const warnings = this.antiPatterns.filter((p) => p.severity === 'WARNING').length;
    const bundleImpact = this.estimateBundleImpact(changedFiles, fileContents);

    return {
      summary: {
        totalIssues: this.antiPatterns.length,
        errors,
        warnings,
        bundleImpact,
      },
      antiPatterns: this.antiPatterns,
      recommendation: errors > 0 ? 'BLOCK_MERGE' : warnings > 5 ? 'WARN' : 'APPROVE',
    };
  }
}

module.exports = PerformanceAnalyzer;
