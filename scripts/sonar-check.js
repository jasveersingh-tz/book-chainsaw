#!/usr/bin/env node
/* eslint-disable no-console, global-require */
/* global process, console */

/**
 * SonarQube Compliance Check
 * Validates code meets all SonarQube standards
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runChecks() {
  console.log('🔍 Running SonarQube Compliance Checks\n');
  console.log('='.repeat(70));

  const checks = [
    { name: 'Security Scan', cmd: 'node scripts/security-scan.js' },
    { name: 'Quality Gate', cmd: 'node scripts/quality-gate.js' },
    { name: 'Metrics Report', cmd: 'node scripts/metrics-report.js' },
  ];

  let allPassed = true;

  for (const check of checks) {
    console.log(`\n▶️ Running: ${check.name}`);
    console.log('-'.repeat(70));

    try {
      const { stdout, stderr } = await execAsync(check.cmd, {
        maxBuffer: 10 * 1024 * 1024,
      });
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error(`❌ ${check.name} failed:`);
      console.error(error.message);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('\n✅ All SonarQube checks PASSED!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks FAILED. Fix issues before committing.\n');
    process.exit(1);
  }
}

runChecks();
