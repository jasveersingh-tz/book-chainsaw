#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const { glob } = require('glob');
const DependencyGraphAnalyzer = require('./dependency-graph-analyzer');

/**
 * Test CLI for Dependency Graph Analyzer
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  const projectPath = process.cwd();
  const analyzer = new DependencyGraphAnalyzer(projectPath);

  try {
    switch (command) {
      case 'analyze':
        await analyzeCommand(analyzer, args.slice(1));
        break;

      case 'graph':
        await graphCommand(analyzer);
        break;

      case 'impact':
        await impactCommand(analyzer, args.slice(1));
        break;

      case 'circular':
        await circularCommand(analyzer);
        break;

      case 'help':
        printHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Analyze entire project
 */
async function analyzeCommand(analyzer, args) {
  console.log('🔍 Analyzing project dependencies...\n');

  // Get all TypeScript/JavaScript files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', 'dist/**', '**/*.spec.ts', '**/*.test.ts'],
    absolute: false,
  });

  console.log(`Found ${files.length} files to analyze\n`);

  // Build graph
  await analyzer.buildGraph(files);

  // Get changed files from git
  const changedFiles = await getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('✅ No changed files detected\n');
    printGraphStats(analyzer);
    return;
  }

  console.log(`\n📝 Analyzing impact of ${changedFiles.length} changed files:\n`);
  changedFiles.forEach((file) => console.log(`  - ${file}`));
  console.log();

  // Analyze impact
  const impacts = await analyzer.analyzeImpact(changedFiles);
  const report = analyzer.generateReport(impacts);

  // Print report
  printReport(report);

  // Save report to file
  const reportPath = path.join(process.cwd(), 'dependency-analysis.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}\n`);

  // Exit with error if blocking issues found
  if (report.recommendation.action === 'BLOCK_MERGE') {
    console.error('❌ BLOCKING ISSUES DETECTED - Merge should be blocked\n');
    process.exit(1);
  }
}

/**
 * Show dependency graph
 */
async function graphCommand(analyzer) {
  console.log('📊 Building dependency graph...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
    absolute: false,
  });

  await analyzer.buildGraph(files);

  printGraphStats(analyzer);

  // Show sample dependencies
  console.log('\n📋 Sample Dependencies:\n');
  let count = 0;
  for (const [file, deps] of analyzer.graph.entries()) {
    if (count >= 10) break;
    if (deps.length > 0) {
      console.log(`${file}`);
      deps.forEach((dep) => console.log(`  → ${dep}`));
      console.log();
      count++;
    }
  }
}

/**
 * Analyze impact of specific files
 */
async function impactCommand(analyzer, args) {
  if (args.length === 0) {
    console.error('Error: Please specify files to analyze');
    console.error('Usage: node test-dependency-analyzer.js impact <file1> [file2] ...');
    process.exit(1);
  }

  console.log('🔍 Analyzing impact...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
    absolute: false,
  });

  await analyzer.buildGraph(files);

  const impacts = await analyzer.analyzeImpact(args);

  impacts.forEach((impact) => {
    console.log(`\n📄 ${impact.changedFile}`);
    console.log(`   Severity: ${impact.severity}`);
    console.log(`   Directly affected: ${impact.directlyAffected} files`);
    console.log(`   Total affected: ${impact.totalAffected} files`);

    if (impact.apiChanges.length > 0) {
      console.log(`\n   API Changes:`);
      impact.apiChanges.forEach((change) => {
        const icon = change.breaking ? '❌' : change.type === 'ADDED' ? '✅' : '⚠️';
        console.log(`   ${icon} ${change.type}: ${change.category} "${change.name}"`);
        if (change.details) {
          change.details.forEach((detail) => {
            console.log(`      - ${detail.aspect}: ${JSON.stringify(detail)}`);
          });
        }
      });
    }

    console.log(`\n   Recommendation: ${impact.recommendation.action}`);
    console.log(`   Reason: ${impact.recommendation.reason}`);
    if (impact.recommendation.suggestions) {
      console.log(`   Suggestions:`);
      impact.recommendation.suggestions.forEach((s) => console.log(`     - ${s}`));
    }
  });
}

/**
 * Detect circular dependencies
 */
async function circularCommand(analyzer) {
  console.log('🔄 Detecting circular dependencies...\n');

  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
    absolute: false,
  });

  await analyzer.buildGraph(files);

  const cycles = analyzer.detectCircularDependencies();

  if (cycles.length === 0) {
    console.log('✅ No circular dependencies detected!\n');
  } else {
    console.log(`❌ Found ${cycles.length} circular dependencies:\n`);
    cycles.forEach((cycle, index) => {
      console.log(`${index + 1}. ${cycle.join(' → ')}`);
    });
    console.log();
  }
}

/**
 * Get changed files from git
 */
async function getChangedFiles() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    return output
      .split('\n')
      .filter((file) => file.trim())
      .filter((file) => file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('.spec.'));
  } catch (error) {
    console.warn('Could not get git diff, assuming no changes');
    return [];
  }
}

/**
 * Print graph statistics
 */
function printGraphStats(analyzer) {
  console.log('📊 Dependency Graph Statistics:\n');
  console.log(`   Total files: ${analyzer.graph.size}`);
  console.log(
    `   Files with dependencies: ${[...analyzer.graph.values()].filter((d) => d.length > 0).length}`,
  );
  console.log(`   Files being imported: ${analyzer.reverseGraph.size}`);

  const avgDeps =
    [...analyzer.graph.values()].reduce((sum, deps) => sum + deps.length, 0) / analyzer.graph.size;
  console.log(`   Average dependencies per file: ${avgDeps.toFixed(2)}`);

  const maxDeps = Math.max(...[...analyzer.graph.values()].map((d) => d.length));
  const maxDepsFile = [...analyzer.graph.entries()].find(([, deps]) => deps.length === maxDeps);
  if (maxDepsFile) {
    console.log(`   Most dependencies: ${maxDeps} (${maxDepsFile[0]})`);
  }

  const maxDependents = Math.max(...[...analyzer.reverseGraph.values()].map((d) => d.length));
  const maxDependentsFile = [...analyzer.reverseGraph.entries()].find(
    ([, deps]) => deps.length === maxDependents,
  );
  if (maxDependentsFile) {
    console.log(`   Most dependents: ${maxDependents} (${maxDependentsFile[0]})`);
  }
}

/**
 * Print analysis report
 */
function printReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DEPENDENCY IMPACT ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  // Summary
  console.log('📈 Summary:\n');
  console.log(`   Total files in project: ${report.summary.totalFiles}`);
  console.log(`   Files analyzed for impact: ${report.summary.analyzedFiles}`);
  console.log(`   Total files affected: ${report.summary.totalImpacts}`);
  console.log(`   Critical issues: ${report.summary.criticalIssues}`);
  console.log(`   High severity issues: ${report.summary.highIssues}`);
  console.log(`   Breaking changes: ${report.summary.breakingChanges}`);

  // Circular dependencies
  if (report.circularDependencies.length > 0) {
    console.log(`\n🔄 Circular Dependencies: ${report.circularDependencies.length}\n`);
    report.circularDependencies.slice(0, 5).forEach((cycle, index) => {
      console.log(`   ${index + 1}. ${cycle.join(' → ')}`);
    });
    if (report.circularDependencies.length > 5) {
      console.log(`   ... and ${report.circularDependencies.length - 5} more`);
    }
  }

  // Detailed impacts
  if (report.impacts.length > 0) {
    console.log('\n📋 Detailed Impact Analysis:\n');

    report.impacts.forEach((impact, index) => {
      const severityIcon = {
        CRITICAL: '🔴',
        HIGH: '🟠',
        MEDIUM: '🟡',
        LOW: '🟢',
      }[impact.severity];

      console.log(`${index + 1}. ${severityIcon} ${impact.changedFile}`);
      console.log(`   Severity: ${impact.severity}`);
      console.log(`   Files affected: ${impact.totalAffected} (${impact.directlyAffected} direct)`);

      if (impact.apiChanges.length > 0) {
        console.log(`   API Changes:`);
        impact.apiChanges.forEach((change) => {
          const changeIcon = change.breaking
            ? '❌ BREAKING'
            : change.type === 'ADDED'
              ? '✅ SAFE'
              : '⚠️ MODIFIED';
          console.log(`     ${changeIcon}: ${change.type} ${change.category} "${change.name}"`);
        });
      }

      console.log(`   Action: ${impact.recommendation.action}`);
      console.log(`   Reason: ${impact.recommendation.reason}`);

      if (impact.recommendation.suggestions) {
        console.log(`   Suggestions:`);
        impact.recommendation.suggestions.forEach((s) => console.log(`     • ${s}`));
      }

      console.log();
    });
  }

  // Overall recommendation
  console.log('='.repeat(80));
  const actionIcon = {
    BLOCK_MERGE: '❌',
    WARN: '⚠️',
    APPROVE: '✅',
  }[report.recommendation.action];

  console.log(`${actionIcon} RECOMMENDATION: ${report.recommendation.action}`);
  console.log(`   ${report.recommendation.reason}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Print help
 */
function printHelp() {
  console.log(`
Dependency Graph Analyzer - Test CLI

Usage:
  node test-dependency-analyzer.js [command] [options]

Commands:
  analyze           Analyze entire project and detect breaking changes (default)
  graph             Show dependency graph statistics
  impact <files>    Analyze impact of specific files
  circular          Detect circular dependencies
  help              Show this help message

Examples:
  node test-dependency-analyzer.js
  node test-dependency-analyzer.js graph
  node test-dependency-analyzer.js impact src/services/auth.service.ts
  node test-dependency-analyzer.js circular
  `);
}

// Run
main();
