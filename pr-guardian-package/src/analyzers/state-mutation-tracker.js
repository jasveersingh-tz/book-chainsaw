/**
 * State Mutation Tracker
 * Detects changes to shared state and side effects
 */
class StateMutationTracker {
  constructor() {
    this.stateVariables = new Map(); // variable -> locations
    this.mutations = [];
  }

  /**
   * Track state mutations in changed files
   */
  async trackMutations(changedFiles, fileContents) {
    console.log(`Tracking state mutations in ${changedFiles.length} files...`);

    for (const file of changedFiles) {
      const content = fileContents.get(file) || '';
      const mutations = this.findStateMutations(content, file);
      this.mutations.push(...mutations);
    }

    return this.mutations;
  }

  /**
   * Find state mutations in file
   */
  findStateMutations(content, filePath) {
    const mutations = [];
    const lines = content.split('\n');

    // Patterns that indicate state mutation
    const mutationPatterns = [
      // Direct assignment
      { regex: /(\w+)\s*=\s*([^;]+);/, type: 'ASSIGNMENT' },
      // Array mutations
      { regex: /(\w+)\.push\(/, type: 'ARRAY_PUSH' },
      { regex: /(\w+)\.pop\(/, type: 'ARRAY_POP' },
      { regex: /(\w+)\.splice\(/, type: 'ARRAY_SPLICE' },
      // Object mutations
      { regex: /(\w+)\[['"](\w+)['"]\]\s*=/, type: 'OBJECT_PROPERTY' },
      // State management
      { regex: /setState\(/, type: 'SET_STATE' },
      { regex: /\.next\(/, type: 'RXJS_NEXT' },
      { regex: /dispatch\(/, type: 'DISPATCH' },
      // Global mutations
      { regex: /window\.(\w+)\s*=/, type: 'WINDOW_MUTATION' },
      { regex: /document\.(\w+)\s*=/, type: 'DOCUMENT_MUTATION' },
    ];

    lines.forEach((line, index) => {
      for (const pattern of mutationPatterns) {
        const match = line.match(pattern.regex);
        if (match) {
          mutations.push({
            type: pattern.type,
            variable: match[1] || 'unknown',
            file: filePath,
            line: index + 1,
            code: line.trim(),
            risk: this.assessMutationRisk(pattern.type, line),
          });
        }
      }
    });

    return mutations;
  }

  /**
   * Assess mutation risk
   */
  assessMutationRisk(type, code) {
    // High risk mutations
    if (
      type === 'WINDOW_MUTATION' ||
      type === 'DOCUMENT_MUTATION' ||
      code.includes('localStorage') ||
      code.includes('sessionStorage')
    ) {
      return 'HIGH';
    }

    // Medium risk
    if (type === 'SET_STATE' || type === 'DISPATCH' || type === 'RXJS_NEXT') {
      return 'MEDIUM';
    }

    // Low risk
    return 'LOW';
  }

  /**
   * Find shared state variables
   */
  findSharedState(mutations) {
    const sharedState = [];
    const variableCounts = new Map();

    // Count mutations per variable
    for (const mutation of mutations) {
      const count = variableCounts.get(mutation.variable) || 0;
      variableCounts.set(mutation.variable, count + 1);
    }

    // Variables mutated in multiple places are shared state
    for (const [variable, count] of variableCounts.entries()) {
      if (count > 1) {
        sharedState.push({
          variable,
          mutationCount: count,
          risk: count > 5 ? 'HIGH' : count > 2 ? 'MEDIUM' : 'LOW',
          mutations: mutations.filter((m) => m.variable === variable),
        });
      }
    }

    return sharedState;
  }

  /**
   * Generate mutation report
   */
  generateReport() {
    const sharedState = this.findSharedState(this.mutations);
    const highRisk = this.mutations.filter((m) => m.risk === 'HIGH').length;

    return {
      summary: {
        totalMutations: this.mutations.length,
        sharedStateVariables: sharedState.length,
        highRiskMutations: highRisk,
      },
      mutations: this.mutations,
      sharedState,
      recommendation: highRisk > 0 ? 'WARN' : sharedState.length > 5 ? 'WARN' : 'APPROVE',
    };
  }
}

module.exports = StateMutationTracker;
