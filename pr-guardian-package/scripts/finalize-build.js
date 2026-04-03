const fs = require('fs');
const path = require('path');

console.log('🔧 Finalizing build...');

// Create CLI wrapper
const cliContent = `#!/usr/bin/env node
require('../lib/core/pr-guardian.js');
`;

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir);
}

fs.writeFileSync(path.join(binDir, 'cli.js'), cliContent);
fs.chmodSync(path.join(binDir, 'cli.js'), '755');

console.log('   ✓ CLI wrapper created');

// Create main index.js
const indexContent = `// Main exports (obfuscated)
module.exports = {
  PRGuardian: require('./core/pr-guardian.js'),
  analyzers: {
    DependencyGraph: require('./analyzers/dependency-graph-analyzer.js'),
    CallGraph: require('./analyzers/call-graph-analyzer.js'),
    Contract: require('./analyzers/contract-verifier.js'),
    StateMutation: require('./analyzers/state-mutation-tracker.js'),
    Performance: require('./analyzers/performance-analyzer.js'),
    MergeDecision: require('./analyzers/merge-decision-engine.js'),
    Learning: require('./analyzers/pr-learning-analyzer.js'),
  }
};
`;

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'index.js'), indexContent);
console.log('   ✓ Main index created');

console.log('✅ Build finalized\n');
