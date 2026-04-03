#!/usr/bin/env node

/**
 * Local Testing Script
 * Tests the package on your production project before publishing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testLocal() {
  console.log('\n🧪 PR Guardian - Local Testing Setup\n');
  console.log('This will help you test the package on your production project\n');

  try {
    // Step 1: Build the package
    console.log('📦 Step 1: Building package...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete\n');

    // Step 2: Create npm link
    console.log('🔗 Step 2: Creating local link...');
    execSync('npm link', { stdio: 'inherit' });
    console.log('✅ Link created\n');

    // Step 3: Get production project path
    const prodPath = await question('📁 Enter path to your production project: ');
    
    if (!prodPath || !fs.existsSync(prodPath)) {
      console.error('❌ Invalid path!');
      process.exit(1);
    }

    // Step 4: Link in production project
    console.log(`\n🔗 Step 3: Linking to ${prodPath}...\n`);
    execSync('npm link @pr-guardian/core', { 
      cwd: prodPath,
      stdio: 'inherit' 
    });
    console.log('✅ Linked successfully\n');

    // Step 5: Instructions for testing
    console.log('\n📋 Testing Instructions:\n');
    console.log(`   1. cd ${prodPath}`);
    console.log('   2. npx pr-guardian analyze');
    console.log('   3. Review the output\n');

    console.log('💡 To test initialization:');
    console.log(`   1. rm ${path.join(prodPath, '.pr-guardian-initialized')}`);
    console.log('   2. npx pr-guardian analyze');
    console.log('   3. Watch it analyze 100 commits\n');

    console.log('🧹 When done testing:');
    console.log(`   1. cd ${prodPath}`);
    console.log('   2. npm unlink @pr-guardian/core');
    console.log('   3. cd <this-package>');
    console.log('   4. npm unlink\n');

    const runNow = await question('🚀 Run test now? (y/n): ');
    
    if (runNow.toLowerCase() === 'y') {
      console.log('\n🎬 Running PR Guardian on your production project...\n');
      execSync('npx pr-guardian analyze', {
        cwd: prodPath,
        stdio: 'inherit'
      });
    }

    rl.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

testLocal();
