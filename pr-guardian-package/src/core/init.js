#!/usr/bin/env node

/**
 * Auto-initialization wrapper
 * Runs on first use to learn from repository history
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PRGuardianInit {
  constructor() {
    this.configFile = path.join(process.cwd(), '.pr-guardian-initialized');
    this.isInitialized = fs.existsSync(this.configFile);
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('✅ PR Guardian already initialized\n');
      return true;
    }

    console.log('\n🎬 PR Guardian - First Time Setup\n');
    console.log('This will analyze your repository to learn patterns...\n');

    try {
      // Check if we're in a git repository
      const isGitRepo = await this.checkGitRepository();
      
      if (!isGitRepo) {
        console.warn('⚠️  Not a git repository. Skipping initialization.\n');
        this.markInitialized();
        return false;
      }

      // Analyze last 100 commits/PRs
      console.log('📚 Analyzing last 100 commits to learn patterns...');
      await this.analyzeHistory();

      // Mark as initialized
      this.markInitialized();

      console.log('\n✅ Initialization complete!');
      console.log('   PR Guardian is now tuned to your repository.\n');

      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      console.log('   PR Guardian will work with default settings.\n');
      this.markInitialized(); // Don't block, just use defaults
      return false;
    }
  }

  async checkGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { 
        stdio: 'ignore',
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  async analyzeHistory() {
    try {
      // Get last 100 commits
      const commits = execSync(
        'git log -100 --format="%H|%an|%ae|%ad|%s" --date=iso',
        { 
          encoding: 'utf-8',
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024
        }
      );

      const commitLines = commits.trim().split('\n').filter(Boolean);
      console.log(`   Found ${commitLines.length} commits\n`);

      // Analyze patterns
      const patterns = this.extractPatterns(commitLines);

      // Save learned patterns
      const patternsFile = path.join(
        __dirname,
        '..',
        'lib',
        'learned-patterns.json'
      );

      fs.writeFileSync(
        patternsFile,
        JSON.stringify(patterns, null, 2)
      );

      console.log('   ✓ Pattern analysis complete');
      console.log(`   ✓ Learned ${patterns.commitTypes.size} commit types`);
      console.log(`   ✓ Identified ${patterns.commonKeywords.length} common patterns`);

      return patterns;
    } catch (error) {
      console.error('   Failed to analyze history:', error.message);
      return this.getDefaultPatterns();
    }
  }

  extractPatterns(commitLines) {
    const commitTypes = new Map();
    const keywords = new Map();
    const authors = new Set();

    for (const line of commitLines) {
      const [hash, author, email, date, subject] = line.split('|');
      
      // Extract commit type (conventional commits)
      const typeMatch = subject.match(/^(\w+):/);
      if (typeMatch) {
        const type = typeMatch[1];
        commitTypes.set(type, (commitTypes.get(type) || 0) + 1);
      }

      // Extract common keywords
      const words = subject.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 3) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      }

      authors.add(author);
    }

    // Get top keywords
    const sortedKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    return {
      totalCommits: commitLines.length,
      commitTypes: Object.fromEntries(commitTypes),
      commonKeywords: sortedKeywords,
      authorCount: authors.size,
      analyzedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  getDefaultPatterns() {
    return {
      totalCommits: 0,
      commitTypes: {},
      commonKeywords: [],
      authorCount: 0,
      analyzedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  markInitialized() {
    const initData = {
      initialized: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    fs.writeFileSync(this.configFile, JSON.stringify(initData, null, 2));
  }
}

// Export for use
module.exports = PRGuardianInit;

// Run if called directly
if (require.main === module) {
  const init = new PRGuardianInit();
  init.initialize().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
