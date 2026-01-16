#!/usr/bin/env node

const fs = require('fs');

/**
 * PR Metadata Analyzer
 * Validates PR title, description, branch naming, and commit messages
 */

class PRAnalyzer {
  constructor() {
    this.validBranchPrefixes = [
      'feature/',
      'feat/',
      'bugfix/',
      'fix/',
      'hotfix/',
      'chore/',
      'refactor/',
      'docs/',
      'test/',
      'perf/',
      'style/',
    ];

    this.commitTypes = [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'build',
      'ci',
      'chore',
      'revert',
    ];
  }

  /**
   * Analyze PR metadata
   */
  analyze(prData) {
    const issues = [];
    let score = 100;

    // Analyze PR title
    const titleResult = this.analyzeTitle(prData.title);
    issues.push(...titleResult.issues);
    score += titleResult.scoreImpact;

    // Analyze PR description
    const descResult = this.analyzeDescription(prData.description);
    issues.push(...descResult.issues);
    score += descResult.scoreImpact;

    // Analyze branch name
    const branchResult = this.analyzeBranch(prData.branch);
    issues.push(...branchResult.issues);
    score += branchResult.scoreImpact;

    // Analyze commit messages (if provided)
    if (prData.commits) {
      const commitResult = this.analyzeCommits(prData.commits);
      issues.push(...commitResult.issues);
      score += commitResult.scoreImpact;
    }

    // Check PR size
    const sizeResult = this.analyzePRSize(prData);
    issues.push(...sizeResult.issues);
    score += sizeResult.scoreImpact;

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      metadata: {
        title: prData.title,
        description: prData.description,
        branch: prData.branch,
        additions: prData.additions,
        deletions: prData.deletions,
        changedFiles: prData.changedFiles,
      },
    };
  }

  /**
   * Analyze PR title
   */
  analyzeTitle(title) {
    const issues = [];
    let scoreImpact = 0;

    if (!title || title.trim().length === 0) {
      issues.push({
        severity: 'error',
        category: 'PR Title',
        message: 'PR title is empty. Provide a descriptive title.',
      });
      return { issues, scoreImpact: -20 };
    }

    // Check length
    if (title.length < 10) {
      issues.push({
        severity: 'error',
        category: 'PR Title',
        message: `PR title too short (${title.length} chars). Use descriptive titles (min 10 chars).`,
      });
      scoreImpact -= 10;
    } else if (title.length > 100) {
      issues.push({
        severity: 'warning',
        category: 'PR Title',
        message: `PR title too long (${title.length} chars). Keep it concise (max 100 chars).`,
      });
      scoreImpact -= 5;
    } else {
      issues.push({
        severity: 'info',
        category: 'PR Title',
        message: '✓ PR title length appropriate',
      });
    }

    // Check for conventional commit format
    const conventionalPattern =
      /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+/;
    if (conventionalPattern.test(title)) {
      issues.push({
        severity: 'info',
        category: 'PR Title',
        message: '✓ PR title follows conventional commit format',
      });
      scoreImpact += 5;
    } else {
      issues.push({
        severity: 'warning',
        category: 'PR Title',
        message: 'Consider using conventional commit format: type(scope): description',
      });
      scoreImpact -= 3;
    }

    // Check for uppercase first letter
    if (title[0] !== title[0].toUpperCase() && !conventionalPattern.test(title)) {
      issues.push({
        severity: 'info',
        category: 'PR Title',
        message: 'PR title should start with uppercase letter',
      });
      scoreImpact -= 2;
    }

    return { issues, scoreImpact };
  }

  /**
   * Analyze PR description
   */
  analyzeDescription(description) {
    const issues = [];
    let scoreImpact = 0;

    if (!description || description.trim().length === 0) {
      issues.push({
        severity: 'error',
        category: 'PR Description',
        message: 'PR description is empty. Explain what changes and why.',
      });
      return { issues, scoreImpact: -20 };
    }

    // Check length
    if (description.length < 20) {
      issues.push({
        severity: 'error',
        category: 'PR Description',
        message: `PR description insufficient (${description.length} chars). Explain what and why (min 20 chars).`,
      });
      scoreImpact -= 15;
    } else if (description.length > 1000) {
      issues.push({
        severity: 'info',
        category: 'PR Description',
        message: '✓ PR description is comprehensive',
      });
      scoreImpact += 5;
    } else if (description.length > 100) {
      issues.push({
        severity: 'info',
        category: 'PR Description',
        message: '✓ PR description is adequate',
      });
      scoreImpact += 3;
    }

    // Check for common sections
    const hasContext = /## (context|background|why)/i.test(description);
    const hasChanges = /## (changes|what|implementation)/i.test(description);
    const hasTesting = /## (testing|test|tested)/i.test(description);

    if (hasContext && hasChanges) {
      issues.push({
        severity: 'info',
        category: 'PR Description',
        message: '✓ PR description well-structured with context and changes',
      });
      scoreImpact += 5;
    }

    if (hasTesting) {
      issues.push({
        severity: 'info',
        category: 'PR Description',
        message: '✓ PR includes testing information',
      });
      scoreImpact += 3;
    }

    // Check for breaking changes mention
    if (/breaking change/i.test(description)) {
      issues.push({
        severity: 'warning',
        category: 'PR Description',
        message: 'Breaking change detected. Ensure proper documentation and version bump.',
      });
    }

    return { issues, scoreImpact };
  }

  /**
   * Analyze branch name
   */
  analyzeBranch(branch) {
    const issues = [];
    let scoreImpact = 0;

    if (!branch) {
      return { issues, scoreImpact };
    }

    const validPrefix = this.validBranchPrefixes.some((prefix) => branch.startsWith(prefix));

    if (validPrefix) {
      issues.push({
        severity: 'info',
        category: 'Branch Naming',
        message: `✓ Branch "${branch}" follows naming convention`,
      });
      scoreImpact += 3;
    } else {
      issues.push({
        severity: 'warning',
        category: 'Branch Naming',
        message: `Branch "${branch}" doesn't follow convention. Use: ${this.validBranchPrefixes.join(
          ', '
        )}`,
      });
      scoreImpact -= 5;
    }

    // Check for spaces or special characters
    if (/[A-Z\s]/.test(branch)) {
      issues.push({
        severity: 'warning',
        category: 'Branch Naming',
        message: 'Branch name should be lowercase with hyphens (kebab-case)',
      });
      scoreImpact -= 3;
    }

    return { issues, scoreImpact };
  }

  /**
   * Analyze commit messages
   */
  analyzeCommits(commits) {
    const issues = [];
    let scoreImpact = 0;

    if (!commits || commits.length === 0) {
      return { issues, scoreImpact };
    }

    let conventionalCommits = 0;
    let poorCommits = 0;

    commits.forEach((commit, index) => {
      const message = commit.message || commit;

      // Check conventional commit format
      const conventionalPattern = new RegExp(`^(${this.commitTypes.join('|')})(\\(.+\\))?: .+`);
      if (conventionalPattern.test(message)) {
        conventionalCommits++;
      }

      // Check for poor commit messages
      const poorPatterns = [/^(wip|temp|test|fix|update)$/i, /^.{1,5}$/, /^(asdf|qwer|typo)$/i];

      if (poorPatterns.some((pattern) => pattern.test(message))) {
        poorCommits++;
      }
    });

    const conventionalRatio = conventionalCommits / commits.length;

    if (conventionalRatio >= 0.8) {
      issues.push({
        severity: 'info',
        category: 'Commit Messages',
        message: `✓ ${conventionalCommits}/${commits.length} commits follow conventional format`,
      });
      scoreImpact += 5;
    } else if (conventionalRatio >= 0.5) {
      issues.push({
        severity: 'info',
        category: 'Commit Messages',
        message: `${conventionalCommits}/${commits.length} commits follow conventional format`,
      });
    } else {
      issues.push({
        severity: 'warning',
        category: 'Commit Messages',
        message: `Only ${conventionalCommits}/${commits.length} commits follow conventional format`,
      });
      scoreImpact -= 3;
    }

    if (poorCommits > 0) {
      issues.push({
        severity: 'warning',
        category: 'Commit Messages',
        message: `${poorCommits} commit(s) have non-descriptive messages. Use meaningful descriptions.`,
      });
      scoreImpact -= poorCommits * 2;
    }

    return { issues, scoreImpact };
  }

  /**
   * Analyze PR size
   */
  analyzePRSize(prData) {
    const issues = [];
    let scoreImpact = 0;

    const additions = prData.additions || 0;
    const deletions = prData.deletions || 0;
    const changedFiles = prData.changedFiles || 0;
    const totalChanges = additions + deletions;

    // Check PR size
    if (totalChanges > 1000) {
      issues.push({
        severity: 'warning',
        category: 'PR Size',
        message: `Large PR: ${totalChanges} lines changed. Consider splitting into smaller PRs for easier review.`,
      });
      scoreImpact -= 10;
    } else if (totalChanges > 500) {
      issues.push({
        severity: 'info',
        category: 'PR Size',
        message: `Medium PR: ${totalChanges} lines changed. Still reviewable but could be smaller.`,
      });
      scoreImpact -= 3;
    } else {
      issues.push({
        severity: 'info',
        category: 'PR Size',
        message: `✓ Appropriately sized PR: ${totalChanges} lines changed`,
      });
      scoreImpact += 3;
    }

    // Check file count
    if (changedFiles > 30) {
      issues.push({
        severity: 'warning',
        category: 'PR Size',
        message: `${changedFiles} files changed. Large number of files may indicate scope creep.`,
      });
      scoreImpact -= 5;
    }

    return { issues, scoreImpact };
  }
}

// Main execution
if (require.main === module) {
  const prData = {
    title: process.env.PR_TITLE || '',
    description: process.env.PR_DESCRIPTION || '',
    branch: process.env.PR_HEAD_REF || '',
    additions: parseInt(process.env.PR_ADDITIONS || '0'),
    deletions: parseInt(process.env.PR_DELETIONS || '0'),
    changedFiles: parseInt(process.env.PR_CHANGED_FILES || '0'),
  };

  const analyzer = new PRAnalyzer();
  const result = analyzer.analyze(prData);

  console.log(JSON.stringify(result, null, 2));
}

module.exports = PRAnalyzer;
