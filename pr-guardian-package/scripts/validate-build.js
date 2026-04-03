const fs = require('fs');
const path = require('path');

console.log('✅ Validating build...');

const libDir = path.join(__dirname, '..', 'lib');
const requiredFiles = [
  'index.js',
  'analyzers/dependency-graph-analyzer.js',
  'analyzers/call-graph-analyzer.js',
  'analyzers/contract-verifier.js',
  'analyzers/state-mutation-tracker.js',
  'analyzers/performance-analyzer.js',
  'analyzers/merge-decision-engine.js',
  'analyzers/pr-learning-analyzer.js',
  'core/pr-guardian.js'
];

let allValid = true;

for (const file of requiredFiles) {
  const filePath = path.join(libDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ Missing: ${file}`);
    allValid = false;
  } else {
    console.log(`   ✓ ${file}`);
  }
}

if (!allValid) {
  console.error('\n❌ Build validation failed!');
  process.exit(1);
}

console.log('\n✅ Build validation passed!');
