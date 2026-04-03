#!/usr/bin/env node

/**
 * Test script to run PR Guardian multiple times and trigger learning mode
 */

const { execSync } = require('child_process');

console.log('🧪 Testing PR Guardian Learning System\n');
console.log('Running PR Guardian 10 times to trigger learning on run #10...\n');

for (let i = 1; i <= 10; i++) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`RUN #${i}/10`);
  console.log('='.repeat(80));

  try {
    const output = execSync('node scripts/ai-review/pr-guardian.js', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Show only key parts of output
    const lines = output.split('\n');
    const learningLines = lines.filter(
      (line) =>
        line.includes('🧠') ||
        line.includes('Learning') ||
        line.includes('DECISION:') ||
        line.includes('Score:'),
    );

    if (learningLines.length > 0) {
      console.log('\n📊 Key Results:');
      learningLines.forEach((line) => console.log(line));
    } else {
      // Show decision line
      const decisionLine = lines.find((line) => line.includes('DECISION:'));
      const scoreLine = lines.find((line) => line.includes('Score:'));
      if (decisionLine) console.log(decisionLine);
      if (scoreLine) console.log(scoreLine);
    }

    console.log(`\n✅ Run #${i} completed successfully`);
  } catch (error) {
    console.log(`\n❌ Run #${i} failed (this might be expected for BLOCK_MERGE cases)`);

    // Check if learning happened
    if (error.stdout) {
      const learningLines = error.stdout
        .toString()
        .split('\n')
        .filter((line) => line.includes('🧠') || line.includes('Learning'));
      if (learningLines.length > 0) {
        console.log('\n📊 Learning Activity:');
        learningLines.forEach((line) => console.log(line));
      }
    }
  }

  // Small delay between runs
  if (i < 10) {
    const delay = 100;
    const start = Date.now();
    while (Date.now() - start < delay) {
      // Small delay
    }
  }
}

console.log(`\n\n${'='.repeat(80)}`);
console.log('✅ TEST COMPLETE');
console.log('='.repeat(80));
console.log('\n📁 Check these files for learning data:');
console.log('   - scripts/ai-review/learned-patterns.json');
console.log('   - scripts/ai-review/pr-guardian-run-count.json');
console.log('\n');
