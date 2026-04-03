#!/usr/bin/env node

/**
 * PR Learning Analyzer
 *
 * Automatically analyzes historical PRs from production repositories to learn:
 * - What types of changes get approved vs rejected
 * - Common reviewer feedback patterns
 * - Breaking change patterns that humans catch
 * - Code quality issues that require fixes
 *
 * Runs automatically every 10th PR Guardian execution to improve accuracy.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PRLearningAnalyzer {
  constructor() {
    this.learnedPatterns = this.loadLearnedPatterns();
    this.runCount = this.loadRunCount();
    this.learningThreshold = 10; // Learn every 10th run
    this.maxPRsToAnalyze = 50;
  }

  /**
   * Load existing learned patterns from disk
   */
  loadLearnedPatterns() {
    const patternsFile = path.join(__dirname, 'learned-patterns.json');
    if (fs.existsSync(patternsFile)) {
      try {
        return JSON.parse(fs.readFileSync(patternsFile, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load learned patterns, starting fresh:', error.message);
      }
    }

    return {
      approvedPatterns: [],
      rejectedPatterns: [],
      reviewerFeedback: [],
      breakingChangePatterns: [],
      codeQualityRules: [],
      lastUpdated: null,
      totalPRsAnalyzed: 0,
      version: '1.0.0',
    };
  }

  /**
   * Load run count from disk
   */
  loadRunCount() {
    const countFile = path.join(__dirname, 'pr-guardian-run-count.json');
    if (fs.existsSync(countFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(countFile, 'utf-8'));
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Save run count to disk
   */
  saveRunCount(count) {
    const countFile = path.join(__dirname, 'pr-guardian-run-count.json');
    fs.writeFileSync(
      countFile,
      JSON.stringify({ count, lastRun: new Date().toISOString() }, null, 2),
    );
  }

  /**
   * Increment run count and check if learning should trigger
   */
  incrementAndCheckLearning() {
    this.runCount++;
    this.saveRunCount(this.runCount);

    const shouldLearn = this.runCount % this.learningThreshold === 0;

    if (shouldLearn) {
      console.log(`\n🧠 PR Guardian Learning Mode (Run #${this.runCount})`);
      console.log(`📚 Analyzing last ${this.maxPRsToAnalyze} PRs to improve detection...`);
    }

    return shouldLearn;
  }

  /**
   * Analyze git history to extract PR data
   */
  async analyzePRHistory() {
    try {
      // Get last 50 commits with detailed info
      const commits = this.getCommitHistory();

      // Extract PR-related commits (merges, PR numbers, etc.)
      const prData = this.extractPRData(commits);

      // Analyze each PR for patterns
      const patterns = await this.analyzePatterns(prData);

      // Update learned patterns
      this.updateLearnedPatterns(patterns);

      return patterns;
    } catch (error) {
      console.error('Error analyzing PR history:', error.message);
      return null;
    }
  }

  /**
   * Check if current directory is a git repository
   */
  isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get commit history from git
   */
  getCommitHistory() {
    // Validate git repository first
    if (!this.isGitRepository()) {
      console.warn('⚠️  Not a git repository - learning disabled');
      return [];
    }

    try {
      // Get last 50 commits with full details
      const logOutput = execSync(
        `git log -${this.maxPRsToAnalyze} --format="%H|%an|%ae|%ad|%s|%b" --date=iso`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 },
      );

      if (!logOutput || logOutput.trim().length === 0) {
        console.warn('⚠️  No git history available');
        return [];
      }

      const commits = logOutput
        .trim()
        .split('\n')
        .reduce((acc, line) => {
          if (line.includes('|')) {
            const [hash, author, email, date, subject, body] = line.split('|');
            acc.push({ hash, author, email, date, subject, body: body || '' });
          }
          return acc;
        }, []);

      return commits;
    } catch (error) {
      console.error('❌ Failed to fetch git history:', error.message);
      return [];
    }
  }

  /**
   * Extract PR-specific data from commits
   */
  extractPRData(commits) {
    const prData = [];

    for (const commit of commits) {
      const prNumber = this.extractPRNumber(commit.subject);
      const isPRMerge = commit.subject.toLowerCase().includes('merge pull request');
      const isFix = commit.subject.toLowerCase().startsWith('fix');
      const isFeat = commit.subject.toLowerCase().startsWith('feat');
      const isChore = commit.subject.toLowerCase().startsWith('chore');
      const isRefactor = commit.subject.toLowerCase().startsWith('refactor');

      // Get file changes for this commit
      const fileChanges = this.getCommitFileChanges(commit.hash);

      prData.push({
        hash: commit.hash,
        author: commit.author,
        date: commit.date,
        subject: commit.subject,
        body: commit.body,
        prNumber,
        isPRMerge,
        type: this.categorizeCommit(commit),
        fileChanges,
        linesAdded: fileChanges.reduce((sum, f) => sum + f.added, 0),
        linesDeleted: fileChanges.reduce((sum, f) => sum + f.deleted, 0),
        filesChanged: fileChanges.length,
      });
    }

    return prData;
  }

  /**
   * Extract PR number from commit message
   */
  extractPRNumber(subject) {
    const match = subject.match(/#(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Categorize commit by type
   */
  categorizeCommit(commit) {
    const subject = commit.subject.toLowerCase();

    if (subject.startsWith('fix')) return 'fix';
    if (subject.startsWith('feat')) return 'feature';
    if (subject.startsWith('chore')) return 'chore';
    if (subject.startsWith('refactor')) return 'refactor';
    if (subject.startsWith('docs')) return 'documentation';
    if (subject.startsWith('test')) return 'test';
    if (subject.startsWith('perf')) return 'performance';
    if (subject.includes('breaking')) return 'breaking';

    return 'other';
  }

  /**
   * Validate git hash format to prevent command injection
   */
  isValidGitHash(hash) {
    // Match SHA-1 (40 chars) or short hash (7+ chars)
    return /^[0-9a-f]{7,40}$/i.test(hash);
  }

  /**
   * Get file changes for a specific commit
   */
  getCommitFileChanges(hash) {
    // Validate hash to prevent command injection
    if (!this.isValidGitHash(hash)) {
      console.error(`❌ Invalid git hash format: ${hash}`);
      return [];
    }

    try {
      const diffOutput = execSync(`git show --stat --format="" ${hash}`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      });

      const files = [];
      const lines = diffOutput.trim().split('\n');

      for (const line of lines) {
        const match = line.match(/(.+?)\s+\|\s+(\d+)\s+([+-]+)/);
        if (match) {
          const [, filename, changes, indicators] = match;
          const added = (indicators.match(/\+/g) || []).length;
          const deleted = (indicators.match(/-/g) || []).length;

          files.push({
            filename: filename.trim(),
            changes: parseInt(changes),
            added,
            deleted,
          });
        }
      }

      return files;
    } catch (error) {
      console.error(`Failed to get changes for commit ${hash}:`, error.message);
      return [];
    }
  }

  /**
   * Analyze patterns from PR data
   */
  async analyzePatterns(prData) {
    const patterns = {
      approved: [],
      rejected: [],
      reviewFeedback: [],
      breakingChanges: [],
      qualityIssues: [],
    };

    // Group by PR number
    const prGroups = this.groupByPR(prData);

    for (const [prNumber, commits] of Object.entries(prGroups)) {
      const analysis = this.analyzePRGroup(commits);

      if (analysis.wasApproved) {
        patterns.approved.push(analysis);
      } else if (analysis.hadIssues) {
        patterns.rejected.push(analysis);
      }

      // Extract feedback patterns from commit messages
      const feedback = this.extractFeedbackPatterns(commits);
      patterns.reviewFeedback.push(...feedback);

      // Detect breaking change patterns
      const breaking = this.detectBreakingPatterns(commits);
      if (breaking) {
        patterns.breakingChanges.push(breaking);
      }

      // Detect quality issues
      const quality = this.detectQualityIssues(commits);
      patterns.qualityIssues.push(...quality);
    }

    return patterns;
  }

  /**
   * Group commits by PR number
   */
  groupByPR(prData) {
    const groups = {};

    for (const commit of prData) {
      const key = commit.prNumber || commit.hash;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(commit);
    }

    return groups;
  }

  /**
   * Analyze a group of commits belonging to same PR
   */
  analyzePRGroup(commits) {
    const firstCommit = commits[0];
    const lastCommit = commits[commits.length - 1];

    return {
      prNumber: firstCommit.prNumber,
      commits: commits.length,
      type: firstCommit.type,
      wasApproved: lastCommit.isPRMerge,
      hadIssues: commits.some((c) => c.subject.toLowerCase().includes('fix') && c !== firstCommit),
      totalFiles: new Set(commits.flatMap((c) => c.fileChanges.map((f) => f.filename))).size,
      totalLinesAdded: commits.reduce((sum, c) => sum + c.linesAdded, 0),
      totalLinesDeleted: commits.reduce((sum, c) => sum + c.linesDeleted, 0),
      subjects: commits.map((c) => c.subject),
    };
  }

  /**
   * Extract common feedback patterns from commit messages
   */
  extractFeedbackPatterns(commits) {
    const feedback = [];
    const feedbackKeywords = [
      'fix',
      'resolve',
      'improve',
      'add',
      'remove',
      'update',
      'refactor',
      'memory leak',
      'performance',
      'security',
      'bug',
      'issue',
      'cleanup',
      'optimize',
      'enhance',
      'upgrade',
      'downgrade',
    ];

    for (const commit of commits) {
      const text = `${commit.subject} ${commit.body}`.toLowerCase();

      for (const keyword of feedbackKeywords) {
        if (text.includes(keyword)) {
          feedback.push({
            keyword,
            context: commit.subject,
            type: commit.type,
            filesAffected: commit.filesChanged,
          });
        }
      }
    }

    return feedback;
  }

  /**
   * Detect breaking change patterns
   */
  detectBreakingPatterns(commits) {
    const breakingIndicators = [
      'breaking',
      'breaking change',
      'api change',
      'signature change',
      'remove',
      'deprecate',
      'rename',
      'major version',
    ];

    for (const commit of commits) {
      const text = `${commit.subject} ${commit.body}`.toLowerCase();

      for (const indicator of breakingIndicators) {
        if (text.includes(indicator)) {
          return {
            indicator,
            commit: commit.subject,
            files: commit.fileChanges.map((f) => f.filename),
            pattern: this.extractPattern(commit),
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect code quality issues from commit history
   */
  detectQualityIssues(commits) {
    const issues = [];
    const qualityIndicators = [
      { keyword: 'memory leak', severity: 'critical', category: 'performance' },
      { keyword: 'subscription', severity: 'high', category: 'memory' },
      { keyword: 'ondestroy', severity: 'high', category: 'lifecycle' },
      { keyword: 'trackby', severity: 'medium', category: 'performance' },
      { keyword: 'any type', severity: 'medium', category: 'type-safety' },
      { keyword: 'console.log', severity: 'low', category: 'debugging' },
      { keyword: 'todo', severity: 'low', category: 'maintenance' },
    ];

    for (const commit of commits) {
      const text = `${commit.subject} ${commit.body}`.toLowerCase();

      for (const { keyword, severity, category } of qualityIndicators) {
        if (text.includes(keyword)) {
          issues.push({
            keyword,
            severity,
            category,
            commit: commit.subject,
            files: commit.fileChanges.map((f) => f.filename),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Extract code pattern from commit
   */
  extractPattern(commit) {
    const patterns = {
      hasTests: commit.fileChanges.some(
        (f) => f.filename.includes('.spec.') || f.filename.includes('.test.'),
      ),
      hasComponents: commit.fileChanges.some((f) => f.filename.includes('.component.')),
      hasServices: commit.fileChanges.some((f) => f.filename.includes('.service.')),
      hasModels: commit.fileChanges.some((f) => f.filename.includes('model')),
      hasConfig: commit.fileChanges.some(
        (f) => f.filename.includes('config') || f.filename.includes('.json'),
      ),
      fileTypes: [...new Set(commit.fileChanges.map((f) => path.extname(f.filename)))],
    };

    return patterns;
  }

  /**
   * Update learned patterns with new analysis
   */
  updateLearnedPatterns(patterns) {
    // Merge approved patterns
    this.learnedPatterns.approvedPatterns.push(...patterns.approved);

    // Merge rejected patterns
    this.learnedPatterns.rejectedPatterns.push(...patterns.rejected);

    // Aggregate feedback patterns
    this.aggregateFeedback(patterns.reviewFeedback);

    // Update breaking change patterns
    this.learnedPatterns.breakingChangePatterns.push(...patterns.breakingChanges.filter(Boolean));

    // Update quality rules
    this.aggregateQualityRules(patterns.qualityIssues);

    // Update metadata
    this.learnedPatterns.lastUpdated = new Date().toISOString();
    this.learnedPatterns.totalPRsAnalyzed += patterns.approved.length + patterns.rejected.length;

    // Keep only last 100 patterns of each type (prevent unbounded growth)
    this.prunePatterns();

    // Save to disk
    this.saveLearnedPatterns();
  }

  /**
   * Aggregate feedback patterns with frequency counting
   */
  aggregateFeedback(newFeedback) {
    const feedbackMap = new Map();

    // Load existing feedback
    for (const fb of this.learnedPatterns.reviewerFeedback) {
      const key = `${fb.keyword}:${fb.type}`;
      feedbackMap.set(key, fb);
    }

    // Add new feedback
    for (const fb of newFeedback) {
      const key = `${fb.keyword}:${fb.type}`;
      if (feedbackMap.has(key)) {
        const existing = feedbackMap.get(key);
        existing.frequency = (existing.frequency || 1) + 1;
        existing.contexts.push(fb.context);
      } else {
        feedbackMap.set(key, {
          ...fb,
          frequency: 1,
          contexts: [fb.context],
        });
      }
    }

    this.learnedPatterns.reviewerFeedback = Array.from(feedbackMap.values());
  }

  /**
   * Aggregate quality rules from issues
   */
  aggregateQualityRules(qualityIssues) {
    const rulesMap = new Map();

    // Load existing rules
    for (const rule of this.learnedPatterns.codeQualityRules) {
      rulesMap.set(rule.keyword, rule);
    }

    // Add new rules
    for (const issue of qualityIssues) {
      if (rulesMap.has(issue.keyword)) {
        const existing = rulesMap.get(issue.keyword);
        existing.occurrences = (existing.occurrences || 1) + 1;
        existing.affectedFiles.push(...issue.files);
      } else {
        rulesMap.set(issue.keyword, {
          keyword: issue.keyword,
          severity: issue.severity,
          category: issue.category,
          occurrences: 1,
          affectedFiles: issue.files,
          shouldBlock: issue.severity === 'critical',
        });
      }
    }

    this.learnedPatterns.codeQualityRules = Array.from(rulesMap.values());
  }

  /**
   * Prune old patterns to prevent unbounded growth
   */
  prunePatterns() {
    const maxPatterns = 100;

    // Keep only recent approved patterns
    if (this.learnedPatterns.approvedPatterns.length > maxPatterns) {
      this.learnedPatterns.approvedPatterns =
        this.learnedPatterns.approvedPatterns.slice(-maxPatterns);
    }

    // Keep only recent rejected patterns
    if (this.learnedPatterns.rejectedPatterns.length > maxPatterns) {
      this.learnedPatterns.rejectedPatterns =
        this.learnedPatterns.rejectedPatterns.slice(-maxPatterns);
    }

    // Keep top feedback patterns by frequency
    this.learnedPatterns.reviewerFeedback.sort((a, b) => (b.frequency || 1) - (a.frequency || 1));
    this.learnedPatterns.reviewerFeedback = this.learnedPatterns.reviewerFeedback.slice(
      0,
      maxPatterns,
    );

    // Keep all breaking change patterns (they're critical)
    // But limit to 50
    if (this.learnedPatterns.breakingChangePatterns.length > 50) {
      this.learnedPatterns.breakingChangePatterns =
        this.learnedPatterns.breakingChangePatterns.slice(-50);
    }

    // Keep top quality rules by occurrence
    this.learnedPatterns.codeQualityRules.sort(
      (a, b) => (b.occurrences || 1) - (a.occurrences || 1),
    );
    this.learnedPatterns.codeQualityRules = this.learnedPatterns.codeQualityRules.slice(
      0,
      maxPatterns,
    );
  }

  /**
   * Save learned patterns to disk
   */
  saveLearnedPatterns() {
    const patternsFile = path.join(__dirname, 'learned-patterns.json');
    fs.writeFileSync(patternsFile, JSON.stringify(this.learnedPatterns, null, 2));
    console.log(`\n✅ Learned patterns saved to ${patternsFile}`);
  }

  /**
   * Generate summary of learned patterns
   */
  generateSummary() {
    const summary = {
      totalPRsAnalyzed: this.learnedPatterns.totalPRsAnalyzed,
      approvedPatterns: this.learnedPatterns.approvedPatterns.length,
      rejectedPatterns: this.learnedPatterns.rejectedPatterns.length,
      reviewFeedbackPatterns: this.learnedPatterns.reviewerFeedback.length,
      breakingChangePatterns: this.learnedPatterns.breakingChangePatterns.length,
      qualityRules: this.learnedPatterns.codeQualityRules.length,
      lastUpdated: this.learnedPatterns.lastUpdated,

      topFeedback: this.learnedPatterns.reviewerFeedback
        .slice(0, 5)
        .map((f) => ({ keyword: f.keyword, frequency: f.frequency, type: f.type })),

      topQualityIssues: this.learnedPatterns.codeQualityRules
        .slice(0, 5)
        .map((r) => ({ keyword: r.keyword, severity: r.severity, occurrences: r.occurrences })),
    };

    return summary;
  }

  /**
   * Apply learned patterns to current PR analysis
   */
  applyLearnedPatterns(currentAnalysis) {
    const adjustments = {
      scoreAdjustments: [],
      additionalIssues: [],
      severityAdjustments: [],
    };

    // Check against quality rules
    for (const rule of this.learnedPatterns.codeQualityRules) {
      if (rule.occurrences >= 3 && rule.shouldBlock) {
        // This pattern has been fixed multiple times, treat it seriously
        adjustments.severityAdjustments.push({
          pattern: rule.keyword,
          reason: `Historical data shows this issue appears frequently (${rule.occurrences} times)`,
          adjustment: 'increase',
        });
      }
    }

    // Check against breaking change patterns
    for (const pattern of this.learnedPatterns.breakingChangePatterns) {
      if (pattern && pattern.indicator) {
        adjustments.additionalIssues.push({
          type: 'breaking-change-pattern',
          pattern: pattern.indicator,
          suggestion: 'This matches a historical breaking change pattern',
        });
      }
    }

    // Check against approved patterns for score boost
    const approvedTypes = this.learnedPatterns.approvedPatterns.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {});

    if (currentAnalysis.type && approvedTypes[currentAnalysis.type] >= 5) {
      adjustments.scoreAdjustments.push({
        reason: `This type (${currentAnalysis.type}) has been approved ${approvedTypes[currentAnalysis.type]} times`,
        adjustment: +5,
      });
    }

    return adjustments;
  }

  /**
   * Main execution method
   */
  async run() {
    const shouldLearn = this.incrementAndCheckLearning();

    if (!shouldLearn) {
      // Just return existing patterns without learning
      return this.learnedPatterns;
    }

    console.log('🔍 Fetching commit history...');
    const patterns = await this.analyzePRHistory();

    if (patterns) {
      const summary = this.generateSummary();
      console.log('\n📊 Learning Summary:');
      console.log(`   Total PRs Analyzed: ${summary.totalPRsAnalyzed}`);
      console.log(`   Approved Patterns: ${summary.approvedPatterns}`);
      console.log(`   Rejected Patterns: ${summary.rejectedPatterns}`);
      console.log(`   Quality Rules: ${summary.qualityRules}`);
      console.log(`   Breaking Change Patterns: ${summary.breakingChangePatterns}`);

      if (summary.topQualityIssues.length > 0) {
        console.log('\n🎯 Top Quality Issues Learned:');
        for (const issue of summary.topQualityIssues) {
          console.log(
            `   - ${issue.keyword} (${issue.severity}) - ${issue.occurrences} occurrences`,
          );
        }
      }

      console.log(
        `\n🧠 PR Guardian is now smarter! Next learning in ${this.learningThreshold} runs.`,
      );
    }

    return this.learnedPatterns;
  }
}

// Export for use in pr-guardian.js
module.exports = PRLearningAnalyzer;

// Allow running standalone
if (require.main === module) {
  const analyzer = new PRLearningAnalyzer();
  analyzer
    .run()
    .then(() => {
      console.log('\n✅ Learning complete!');
    })
    .catch((error) => {
      console.error('❌ Learning failed:', error);
      process.exit(1);
    });
}
