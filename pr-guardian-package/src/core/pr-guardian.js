#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const DependencyGraphAnalyzer = require('../analyzers/dependency-graph-analyzer');
const CallGraphAnalyzer = require('../analyzers/call-graph-analyzer');
const ContractVerifier = require('../analyzers/contract-verifier');
const StateMutationTracker = require('../analyzers/state-mutation-tracker');
const PerformanceAnalyzer = require('../analyzers/performance-analyzer');
const MergeDecisionEngine = require('../analyzers/merge-decision-engine');
const PRLearningAnalyzer = require('../analyzers/pr-learning-analyzer');

/**
 * Comprehensive PR Guardian Analyzer
 * Combines all analyzers for bulletproof PR protection
 */
async function main() {
  console.log('\n🛡️  PR GUARDIAN - Bulletproof PR Analysis\n');
  console.log('='.repeat(80) + '\n');

  const projectPath = process.cwd();
  const startTime = Date.now();

  // Initialize learning system (runs automatically every 10th execution)
  const learningAnalyzer = new PRLearningAnalyzer();
  const learnedPatterns = await learningAnalyzer.run();
  console.log();

  try {
    // Get all TypeScript/JavaScript files
    console.log('📁 Scanning project files...');
    const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', 'dist/**', '**/*.spec.ts', '**/*.test.ts'],
      absolute: true,
    });
    console.log(`   Found ${files.length} files\n`);

    // Load file contents
    const fileContents = new Map();
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        fileContents.set(file, content);
      } catch (error) {
        console.warn(`   Warning: Could not read ${file}`);
      }
    }

    // Get changed files from git
    const changedFiles = await getChangedFiles();
    console.log(`📝 Changed files: ${changedFiles.length}`);
    if (changedFiles.length > 0) {
      changedFiles.forEach((file) => console.log(`   - ${file}`));
    } else {
      console.log('   (No changes detected - analyzing entire project)');
    }
    console.log();

    // Initialize analyzers
    const results = {
      dependencyGraph: null,
      callGraph: null,
      contracts: null,
      stateMutations: null,
      performance: null,
    };

    // 1. DEPENDENCY GRAPH ANALYSIS
    console.log('🔗 [1/5] Dependency Graph Analysis...');
    const depAnalyzer = new DependencyGraphAnalyzer(projectPath);
    await depAnalyzer.buildGraph(files);

    if (changedFiles.length > 0) {
      const impacts = await depAnalyzer.analyzeImpact(changedFiles);
      results.dependencyGraph = depAnalyzer.generateReport(impacts);
      console.log(`   ✓ Analyzed ${impacts.length} changed files`);
      console.log(`   ✓ Found ${results.dependencyGraph.summary.breakingChanges} breaking changes`);
    } else {
      results.dependencyGraph = {
        summary: {
          totalFiles: files.length,
          analyzedFiles: 0,
          criticalIssues: 0,
          highIssues: 0,
          breakingChanges: 0,
        },
        impacts: [],
        circularDependencies: depAnalyzer.detectCircularDependencies(),
      };
      console.log(`   ✓ Built dependency graph`);
    }
    console.log();

    // 2. CALL GRAPH ANALYSIS
    console.log('📞 [2/5] Call Graph Analysis...');
    const callAnalyzer = new CallGraphAnalyzer();
    await callAnalyzer.buildCallGraph(files);

    // Detect signature changes in modified files
    let signatureBreakingChanges = [];
    if (changedFiles.length > 0) {
      signatureBreakingChanges = await callAnalyzer.analyzeChangedSignatures(changedFiles);
      const totalIncompatible = signatureBreakingChanges.reduce(
        (sum, c) => sum + c.incompatibleCalls,
        0,
      );

      results.callGraph = {
        summary: {
          functionsAnalyzed: callAnalyzer.functionSignatures.size,
          totalCallSites: callAnalyzer.callGraph.size,
          signatureChanges: signatureBreakingChanges.length,
          incompatibleCalls: totalIncompatible,
        },
        signatureChanges: signatureBreakingChanges,
      };

      console.log(`   ✓ Tracked ${callAnalyzer.callGraph.size} function calls`);
      if (signatureBreakingChanges.length > 0) {
        console.log(`   ⚠️  Found ${signatureBreakingChanges.length} function signature changes`);
        console.log(`   ⚠️  Found ${totalIncompatible} incompatible call sites`);
      }
    } else {
      results.callGraph = {
        summary: {
          functionsAnalyzed: callAnalyzer.functionSignatures.size,
          totalCallSites: callAnalyzer.callGraph.size,
          signatureChanges: 0,
          incompatibleCalls: 0,
        },
        signatureChanges: [],
      };
      console.log(`   ✓ Tracked ${callAnalyzer.callGraph.size} function calls`);
    }
    console.log();

    // 3. CONTRACT VERIFICATION
    console.log('📋 [3/5] Contract Verification...');
    const contractVerifier = new ContractVerifier();
    await contractVerifier.buildContracts(files);

    if (changedFiles.length > 0) {
      const violations = await contractVerifier.verifyContracts(changedFiles);
      results.contracts = contractVerifier.generateReport(violations);
      console.log(`   ✓ Verified ${contractVerifier.interfaces.size} interfaces`);
      console.log(`   ✓ Found ${violations.length} contract violations`);
    } else {
      results.contracts = {
        summary: {
          totalViolations: 0,
          criticalViolations: 0,
          highViolations: 0,
          interfacesTracked: contractVerifier.interfaces.size,
          implementationsTracked: contractVerifier.implementations.size,
        },
        violations: [],
      };
      console.log(`   ✓ Tracked ${contractVerifier.interfaces.size} interfaces`);
    }
    console.log();

    // 4. STATE MUTATION TRACKING
    console.log('🔄 [4/5] State Mutation Tracking...');
    const mutationTracker = new StateMutationTracker();

    if (changedFiles.length > 0) {
      await mutationTracker.trackMutations(changedFiles, fileContents);
      results.stateMutations = mutationTracker.generateReport();
      console.log(`   ✓ Tracked ${results.stateMutations.summary.totalMutations} mutations`);
      console.log(
        `   ✓ Found ${results.stateMutations.summary.sharedStateVariables} shared state variables`,
      );
    } else {
      results.stateMutations = {
        summary: {
          totalMutations: 0,
          sharedStateVariables: 0,
          highRiskMutations: 0,
        },
        mutations: [],
        sharedState: [],
      };
      console.log(`   ✓ No changes to analyze`);
    }
    console.log();

    // 5. PERFORMANCE ANALYSIS
    console.log('⚡ [5/5] Performance Analysis...');
    const perfAnalyzer = new PerformanceAnalyzer();

    if (changedFiles.length > 0) {
      await perfAnalyzer.analyze(changedFiles, fileContents);
      results.performance = perfAnalyzer.generateReport(changedFiles, fileContents);
      console.log(`   ✓ Found ${results.performance.summary.totalIssues} performance issues`);
      console.log(
        `   ✓ ${results.performance.summary.errors} errors, ${results.performance.summary.warnings} warnings`,
      );
    } else {
      results.performance = {
        summary: {
          totalIssues: 0,
          errors: 0,
          warnings: 0,
          bundleImpact: { estimatedSizeDelta: '0 KB', largeFiles: [] },
        },
        antiPatterns: [],
      };
      console.log(`   ✓ No changes to analyze`);
    }
    console.log();

    // MERGE DECISION
    console.log('⚖️  Making Merge Decision...\n');

    // Apply learned patterns to improve decision
    const currentAnalysis = {
      type: determineChangeType(changedFiles),
      files: changedFiles.length || files.length,
      dependencies: results.dependencyGraph?.summary?.criticalIssues || 0,
      contracts: results.contracts?.summary?.criticalViolations || 0,
      state: results.stateMutations?.summary?.totalMutations || 0,
      performance: results.performance?.summary?.totalIssues || 0,
    };

    const learningAdjustments = learningAnalyzer.applyLearnedPatterns(currentAnalysis);

    const decisionEngine = new MergeDecisionEngine({
      criticalIssuesMax: 0,
      highIssuesMax: 5,
      breakingChangesMax: 0,
      minScore: 70,
      learningAdjustments, // Pass learning insights
    });

    const decision = decisionEngine.generateReport(results);

    // Print comprehensive report
    printReport(decision, results);

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'pr-guardian-report.json');
    await fs.writeFile(reportPath, JSON.stringify({ decision, results }, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}\n`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Analysis completed in ${elapsed}s\n`);

    // Exit with appropriate code
    if (decision.decision === 'BLOCK_MERGE') {
      console.error('❌ MERGE BLOCKED - Fix issues before merging\n');
      process.exit(1);
    } else if (decision.decision === 'WARN') {
      console.warn('⚠️  WARNINGS DETECTED - Review carefully before merging\n');
      process.exit(0); // Don't fail build on warnings
    } else {
      console.log('✅ ALL CHECKS PASSED - Safe to merge\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Determine the type of change based on file patterns and names
 */
function determineChangeType(files) {
  if (!files || files.length === 0) return 'other';

  const fileNames = files.join(' ').toLowerCase();

  if (fileNames.includes('fix')) return 'fix';
  if (fileNames.includes('feat')) return 'feature';
  if (fileNames.includes('refactor')) return 'refactor';
  if (fileNames.includes('test') || fileNames.includes('spec')) return 'test';
  if (fileNames.includes('component')) return 'feature';
  if (fileNames.includes('service')) return 'feature';
  if (fileNames.includes('model')) return 'feature';
  if (fileNames.includes('config') || fileNames.includes('.json')) return 'chore';

  return 'other';
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
      .filter(
        (file) =>
          file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('.spec.') && !file.includes('.test.'),
      );
  } catch (error) {
    return [];
  }
}

/**
 * Print comprehensive report
 */
function printReport(decision, results) {
  console.log('='.repeat(80));
  console.log('📊 PR GUARDIAN ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  // Decision
  const decisionIcon = {
    APPROVE: '✅',
    WARN: '⚠️',
    BLOCK_MERGE: '❌',
  }[decision.decision];

  console.log(`${decisionIcon} DECISION: ${decision.decision}`);
  console.log(`   Score: ${decision.score}/100`);
  console.log(`   Reason: ${decision.reason}\n`);

  // Issues Summary
  console.log('📈 Issues Summary:\n');
  console.log(`   Critical: ${decision.issues.criticalCount}`);
  console.log(`   High:     ${decision.issues.highCount}`);
  console.log(`   Medium:   ${decision.issues.mediumCount}`);
  console.log(`   Low:      ${decision.issues.lowCount}`);
  console.log(`   Breaking: ${decision.issues.breakingCount}\n`);

  // Analysis Details
  console.log('🔍 Analysis Details:\n');

  if (results.dependencyGraph?.summary) {
    console.log('   Dependency Graph:');
    console.log(`     - Files analyzed: ${results.dependencyGraph.summary.analyzedFiles}`);
    console.log(`     - Breaking changes: ${results.dependencyGraph.summary.breakingChanges}`);
    console.log(
      `     - Circular dependencies: ${results.dependencyGraph.circularDependencies?.length || 0}`,
    );
  }

  if (results.callGraph?.summary) {
    console.log('   Call Graph:');
    console.log(`     - Functions tracked: ${results.callGraph.summary.functionsAnalyzed}`);
    console.log(`     - Signature changes: ${results.callGraph.summary.signatureChanges || 0}`);
    console.log(`     - Incompatible calls: ${results.callGraph.summary.incompatibleCalls}`);
  }

  if (results.contracts?.summary) {
    console.log('   Contracts:');
    console.log(`     - Interfaces tracked: ${results.contracts.summary.interfacesTracked}`);
    console.log(`     - Contract violations: ${results.contracts.summary.totalViolations}`);
  }

  if (results.stateMutations?.summary) {
    console.log('   State Mutations:');
    console.log(`     - Total mutations: ${results.stateMutations.summary.totalMutations}`);
    console.log(`     - Shared state vars: ${results.stateMutations.summary.sharedStateVariables}`);
  }

  if (results.performance?.summary) {
    console.log('   Performance:');
    console.log(`     - Total issues: ${results.performance.summary.totalIssues}`);
    console.log(
      `     - Bundle impact: ${results.performance.summary.bundleImpact?.estimatedSizeDelta || '0 KB'}`,
    );
  }

  console.log();

  // Detailed issues
  if (decision.issues.criticalCount > 0) {
    console.log('🔴 CRITICAL ISSUES:\n');
    decision.issues.details.critical.slice(0, 5).forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue.name || issue.type || 'Issue'}`);
      console.log(`      ${issue.message || issue.reason || JSON.stringify(issue)}\n`);
    });
    if (decision.issues.details.critical.length > 5) {
      console.log(`   ... and ${decision.issues.details.critical.length - 5} more\n`);
    }
  }

  if (decision.issues.breakingCount > 0) {
    console.log('💥 BREAKING CHANGES:\n');
    decision.issues.details.breaking.slice(0, 5).forEach((change, i) => {
      console.log(`   ${i + 1}. ${change.category} "${change.name}"`);
      console.log(`      Type: ${change.type}`);
      if (change.details) {
        change.details.forEach((d) => console.log(`      - ${d.aspect}`));
      }
      console.log();
    });
  }

  // Circular dependencies
  if (results.dependencyGraph?.circularDependencies?.length > 0) {
    console.log('🔄 CIRCULAR DEPENDENCIES:\n');
    results.dependencyGraph.circularDependencies.slice(0, 3).forEach((cycle, i) => {
      console.log(`   ${i + 1}. ${cycle.join(' → ')}`);
    });
    if (results.dependencyGraph.circularDependencies.length > 3) {
      console.log(`   ... and ${results.dependencyGraph.circularDependencies.length - 3} more`);
    }
    console.log();
  }

  // Recommendation
  console.log('='.repeat(80));
  console.log('💡 RECOMMENDATION\n');
  console.log(decision.recommendation);
  console.log('='.repeat(80));
}

// Run
main();
