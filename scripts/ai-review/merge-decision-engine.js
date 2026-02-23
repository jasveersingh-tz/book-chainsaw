/**
 * Merge Decision Engine
 * Makes intelligent merge/block decisions based on all analyzer results
 */
class MergeDecisionEngine {
  constructor(config = {}) {
    this.thresholds = {
      criticalIssuesMax: config.criticalIssuesMax || 0,
      highIssuesMax: config.highIssuesMax || 5,
      breakingChangesMax: config.breakingChangesMax || 0,
      minScore: config.minScore || 70,
      ...config.thresholds,
    };
  }

  /**
   * Make merge decision based on all analysis results
   */
  decide(results) {
    const issues = this.aggregateIssues(results);
    const score = this.calculateScore(results);
    const decision = this.evaluateDecision(issues, score);

    return {
      decision: decision.action, // APPROVE, WARN, BLOCK_MERGE
      score,
      reason: decision.reason,
      issues,
      details: decision.details,
      requirements: decision.requirements,
      recommendation: this.generateRecommendation(decision, issues),
    };
  }

  /**
   * Aggregate issues from all analyzers
   */
  aggregateIssues(results) {
    const issues = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      breaking: [],
    };

    // Dependency graph issues
    if (results.dependencyGraph) {
      for (const impact of results.dependencyGraph.impacts || []) {
        if (impact.severity === 'CRITICAL') issues.critical.push(...impact.apiChanges);
        if (impact.severity === 'HIGH') issues.high.push(...impact.apiChanges);

        const breakingChanges = impact.apiChanges?.filter((c) => c.breaking) || [];
        issues.breaking.push(...breakingChanges);
      }
    }

    // Call graph issues
    if (results.callGraph) {
      for (const analysis of results.callGraph.analyses || []) {
        if (analysis.risk === 'CRITICAL') {
          issues.critical.push(...analysis.incompatibilities);
        } else if (analysis.risk === 'HIGH') {
          issues.high.push(...analysis.incompatibilities);
        }
      }
    }

    // Contract violations
    if (results.contracts) {
      for (const violation of results.contracts.violations || []) {
        if (violation.severity === 'CRITICAL') issues.critical.push(violation);
        if (violation.severity === 'HIGH') issues.high.push(violation);
      }
    }

    // Performance issues
    if (results.performance) {
      const errors = results.performance.antiPatterns?.filter((p) => p.severity === 'ERROR') || [];
      const warnings =
        results.performance.antiPatterns?.filter((p) => p.severity === 'WARNING') || [];
      issues.critical.push(...errors);
      issues.medium.push(...warnings);
    }

    // State mutation risks
    if (results.stateMutations) {
      const highRisk = results.stateMutations.mutations?.filter((m) => m.risk === 'HIGH') || [];
      issues.high.push(...highRisk);
    }

    return {
      criticalCount: issues.critical.length,
      highCount: issues.high.length,
      mediumCount: issues.medium.length,
      lowCount: issues.low.length,
      breakingCount: issues.breaking.length,
      details: issues,
    };
  }

  /**
   * Calculate overall quality score
   */
  calculateScore(results) {
    let score = 100;

    // Deductions
    const deductions = {
      criticalIssue: 20,
      highIssue: 10,
      mediumIssue: 5,
      lowIssue: 2,
      breakingChange: 15,
      circularDependency: 10,
    };

    // Dependency graph deductions
    if (results.dependencyGraph) {
      const critical = results.dependencyGraph.summary?.criticalIssues || 0;
      const high = results.dependencyGraph.summary?.highIssues || 0;
      const breaking = results.dependencyGraph.summary?.breakingChanges || 0;
      const circular = results.dependencyGraph.circularDependencies?.length || 0;

      score -= critical * deductions.criticalIssue;
      score -= high * deductions.highIssue;
      score -= breaking * deductions.breakingChange;
      score -= circular * deductions.circularDependency;
    }

    // Call graph deductions
    if (results.callGraph) {
      const incompatible = results.callGraph.summary?.incompatibleCalls || 0;
      score -= incompatible * deductions.highIssue;
    }

    // Contract violations
    if (results.contracts) {
      const critical = results.contracts.summary?.criticalViolations || 0;
      const high = results.contracts.summary?.highViolations || 0;
      score -= critical * deductions.criticalIssue;
      score -= high * deductions.highIssue;
    }

    // Performance issues
    if (results.performance) {
      const errors = results.performance.summary?.errors || 0;
      const warnings = results.performance.summary?.warnings || 0;
      score -= errors * deductions.highIssue;
      score -= warnings * deductions.mediumIssue;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate decision based on issues and score
   */
  evaluateDecision(issues, score) {
    const reasons = [];
    const requirements = [];

    // BLOCK conditions
    if (issues.criticalCount > this.thresholds.criticalIssuesMax) {
      return {
        action: 'BLOCK_MERGE',
        reason: `${issues.criticalCount} critical issues detected (max: ${this.thresholds.criticalIssuesMax})`,
        details: issues.details.critical,
        requirements: ['Fix all critical issues before merge'],
      };
    }

    if (issues.breakingCount > this.thresholds.breakingChangesMax) {
      return {
        action: 'BLOCK_MERGE',
        reason: `${issues.breakingCount} breaking changes detected (max: ${this.thresholds.breakingChangesMax})`,
        details: issues.details.breaking,
        requirements: [
          'Update all affected files in this PR',
          'Or use deprecation strategy for backward compatibility',
          'Or create migration guide',
        ],
      };
    }

    if (issues.highCount > this.thresholds.highIssuesMax) {
      return {
        action: 'BLOCK_MERGE',
        reason: `${issues.highCount} high-severity issues detected (max: ${this.thresholds.highIssuesMax})`,
        details: issues.details.high,
        requirements: ['Fix high-severity issues to reduce count below threshold'],
      };
    }

    if (score < this.thresholds.minScore) {
      return {
        action: 'BLOCK_MERGE',
        reason: `Quality score ${score}/100 below minimum ${this.thresholds.minScore}`,
        details: issues,
        requirements: ['Improve code quality to meet minimum score'],
      };
    }

    // WARN conditions
    if (issues.highCount > 0) {
      reasons.push(`${issues.highCount} high-severity issues need review`);
      requirements.push('Review high-severity issues carefully');
    }

    if (issues.mediumCount > 10) {
      reasons.push(`${issues.mediumCount} medium-severity issues`);
      requirements.push('Consider addressing medium-severity issues');
    }

    if (score < 85) {
      reasons.push(`Quality score is ${score}/100`);
      requirements.push('Consider improving code quality');
    }

    if (reasons.length > 0) {
      return {
        action: 'WARN',
        reason: reasons.join('; '),
        details: issues,
        requirements,
      };
    }

    // APPROVE
    return {
      action: 'APPROVE',
      reason: 'All quality checks passed',
      details: issues,
      requirements: [],
    };
  }

  /**
   * Generate actionable recommendation
   */
  generateRecommendation(decision, issues) {
    const suggestions = [];

    if (decision.action === 'BLOCK_MERGE') {
      suggestions.push('⛔ **DO NOT MERGE**');
      suggestions.push('');
      suggestions.push('**Required Actions:**');
      decision.requirements.forEach((req) => suggestions.push(`- ${req}`));
    } else if (decision.action === 'WARN') {
      suggestions.push('⚠️ **MERGE WITH CAUTION**');
      suggestions.push('');
      suggestions.push('**Recommended Actions:**');
      decision.requirements.forEach((req) => suggestions.push(`- ${req}`));
    } else {
      suggestions.push('✅ **APPROVED FOR MERGE**');
      suggestions.push('');
      suggestions.push('All quality checks passed. Safe to merge.');
    }

    // Specific suggestions based on issue types
    if (issues.breakingCount > 0) {
      suggestions.push('');
      suggestions.push('**Breaking Changes Detected:**');
      suggestions.push('- Create backward-compatible version of changed APIs');
      suggestions.push('- Add deprecation warnings to old APIs');
      suggestions.push('- Update documentation with migration guide');
    }

    if (issues.criticalCount > 0) {
      suggestions.push('');
      suggestions.push('**Critical Issues:**');
      suggestions.push('- Address all critical issues immediately');
      suggestions.push('- Run tests to verify fixes');
    }

    return suggestions.join('\n');
  }

  /**
   * Generate detailed report
   */
  generateReport(results) {
    const decision = this.decide(results);

    return {
      timestamp: new Date().toISOString(),
      decision: decision.decision,
      score: decision.score,
      reason: decision.reason,
      issues: decision.issues,
      recommendation: decision.recommendation,
      details: {
        dependencyGraph: results.dependencyGraph?.summary,
        callGraph: results.callGraph?.summary,
        contracts: results.contracts?.summary,
        performance: results.performance?.summary,
        stateMutations: results.stateMutations?.summary,
      },
      thresholds: this.thresholds,
    };
  }
}

module.exports = MergeDecisionEngine;
