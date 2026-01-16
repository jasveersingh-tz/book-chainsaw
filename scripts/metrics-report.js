#!/usr/bin/env node

/**
 * Code Metrics Report
 * Generates metrics report per SonarQube standards
 */

const fs = require('fs');
const path = require('path');

const metrics = {
  files: 0,
  lines: 0,
  codeLines: 0,
  commentLines: 0,
  blankLines: 0,
  complexMethods: [],
  longMethods: [],
  largeClasses: [],
  duplicateLines: [],
  issues: [],
};

console.log('📊 CODE METRICS REPORT - SonarQube Standards\n');
console.log('='.repeat(70));

analyzeCodebase();
generateReport();

function analyzeCodebase() {
  const srcDir = 'src';

  function walkDir(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !fullPath.includes('node_modules')) {
          walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') && !fullPath.includes('.spec.')) {
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
    const lines = content.split('\n');

    metrics.files++;

    let fileCodeLines = 0;
    let fileCommentLines = 0;
    let fileBlankLines = 0;
    let inMultilineComment = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Count lines
      if (trimmed === '') {
        fileBlankLines++;
        metrics.blankLines++;
      } else if (trimmed.startsWith('//')) {
        fileCommentLines++;
        metrics.commentLines++;
      } else if (trimmed.startsWith('/*')) {
        inMultilineComment = true;
        fileCommentLines++;
        metrics.commentLines++;
      } else if (inMultilineComment) {
        fileCommentLines++;
        metrics.commentLines++;
        if (trimmed.endsWith('*/')) {
          inMultilineComment = false;
        }
      } else {
        fileCodeLines++;
        metrics.codeLines++;
      }
    });

    metrics.lines += lines.length;

    // Analyze methods and classes
    analyzeStructure(filePath, content);

    // Check complexity
    checkComplexity(filePath, lines);
  } catch (e) {
    // Skip files that can't be read
  }
}

function analyzeStructure(filePath, content) {
  // Find classes
  const classMatches = content.matchAll(/class\s+(\w+)/g);
  for (const match of classMatches) {
    const className = match[1];
    // Count methods in class
    const classContent = content.substring(match.index);
    const methodMatches = classContent.match(
      /\s+(public|private|protected)?\s*(async\s+)?(\w+)\s*\(/g
    );
    const methodCount = methodMatches ? methodMatches.length : 0;

    if (methodCount > 30) {
      metrics.largeClasses.push({
        file: filePath,
        class: className,
        methods: methodCount,
      });
    }
  }

  // Find methods
  const methodMatches = content.matchAll(
    /(?:public|private|protected)?\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{([^}]*)}/g
  );
  for (const match of methodMatches) {
    const methodName = match[1];
    const methodBody = match[2];
    const lineCount = methodBody.split('\n').length;

    if (lineCount > 50) {
      metrics.longMethods.push({
        file: filePath,
        method: methodName,
        lines: lineCount,
      });
    }
  }
}

function checkComplexity(filePath, lines) {
  let currentMethod = null;
  let complexity = 0;
  let inMethod = false;

  lines.forEach((line) => {
    // Detect method start
    if (line.match(/\s+(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/)) {
      const match = line.match(/\s+(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/);
      currentMethod = match[1];
      inMethod = true;
      complexity = 1;
    }

    if (inMethod) {
      // Count decision points
      complexity += (line.match(/if\s*\(/g) || []).length;
      complexity += (line.match(/else\s+if\s*\(/g) || []).length;
      complexity += (line.match(/\?\s*:/g) || []).length;
      complexity += (line.match(/catch\s*\(/g) || []).length;
      complexity += (line.match(/for\s*\(/g) || []).length;
      complexity += (line.match(/while\s*\(/g) || []).length;

      // Detect method end
      if (line.trim() === '}') {
        inMethod = false;

        if (complexity > 15) {
          metrics.complexMethods.push({
            file: filePath,
            method: currentMethod,
            complexity: complexity,
          });
        }
      }
    }
  });
}

function generateReport() {
  console.log('\n📈 OVERALL METRICS\n');

  console.log(`Files Analyzed: ${metrics.files}`);
  console.log(`Total Lines: ${metrics.lines}`);
  console.log(`  • Code Lines: ${metrics.codeLines}`);
  console.log(`  • Comment Lines: ${metrics.commentLines}`);
  console.log(`  • Blank Lines: ${metrics.blankLines}`);

  const commentDensity =
    metrics.lines > 0 ? ((metrics.commentLines / metrics.lines) * 100).toFixed(1) : 0;
  console.log(`Comment Density: ${commentDensity}% (Target: 5-10%)\n`);

  // Complexity Report
  if (metrics.complexMethods.length > 0) {
    console.log('🔴 HIGH COMPLEXITY METHODS (>15):\n');
    metrics.complexMethods.slice(0, 5).forEach((method) => {
      console.log(`  • ${method.method} (Complexity: ${method.complexity})`);
      console.log(`    File: ${method.file}\n`);
    });

    if (metrics.complexMethods.length > 5) {
      console.log(`  ... and ${metrics.complexMethods.length - 5} more\n`);
    }
  }

  // Long Methods
  if (metrics.longMethods.length > 0) {
    console.log('🟡 LONG METHODS (>50 lines):\n');
    metrics.longMethods.slice(0, 5).forEach((method) => {
      console.log(`  • ${method.method} (${method.lines} lines)`);
      console.log(`    File: ${method.file}\n`);
    });

    if (metrics.longMethods.length > 5) {
      console.log(`  ... and ${metrics.longMethods.length - 5} more\n`);
    }
  }

  // Large Classes
  if (metrics.largeClasses.length > 0) {
    console.log('🟠 LARGE CLASSES (>30 methods):\n');
    metrics.largeClasses.forEach((cls) => {
      console.log(`  • ${cls.class} (${cls.methods} methods)`);
      console.log(`    File: ${cls.file}\n`);
    });
  }

  // Recommendations
  console.log('='.repeat(70));
  console.log('\n💡 RECOMMENDATIONS:\n');

  if (commentDensity < 5) {
    console.log('• Add more code comments (target 5-10%)');
  }
  if (metrics.complexMethods.length > 5) {
    console.log('• Reduce complexity in methods (target <15)');
  }
  if (metrics.longMethods.length > 5) {
    console.log('• Break long methods into smaller functions');
  }
  if (metrics.largeClasses.length > 0) {
    console.log('• Apply Single Responsibility Principle to large classes');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Quality Grade
  let grade = 'A';
  let issues = 0;

  if (metrics.complexMethods.length > 10) issues += 2;
  if (metrics.longMethods.length > 5) issues += 1;
  if (metrics.largeClasses.length > 0) issues += 1;
  if (commentDensity < 5 || commentDensity > 15) issues += 1;

  if (issues > 3) grade = 'D';
  else if (issues > 2) grade = 'C';
  else if (issues > 1) grade = 'B';

  console.log(`Code Quality Grade: ${grade}\n`);
}
