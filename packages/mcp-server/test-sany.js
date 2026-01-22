#!/usr/bin/env node

// Simple test script for SANY integration
const path = require('path');
const { runSanyParse, parseSanyOutput } = require('./dist/utils/sany');

async function testFile(fileName, expectSuccess) {
  const tlaFilePath = path.join(__dirname, 'test-specs', fileName);
  const toolsDir = path.join(__dirname, '..', '..', 'tools');

  console.log(`\nTesting: ${fileName}`);
  console.log(`Expected: ${expectSuccess ? 'SUCCESS' : 'ERRORS'}`);

  try {
    const procInfo = await runSanyParse(tlaFilePath, toolsDir);
    const result = await parseSanyOutput(procInfo);

    console.log(`Result: ${result.success ? 'SUCCESS' : 'ERRORS'}`);
    console.log(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0 && !expectSuccess) {
      console.log('Sample error:', result.errors[0].message);
    }

    if (result.success === expectSuccess) {
      console.log('✓ Test PASSED');
      return true;
    } else {
      console.log('✗ Test FAILED (unexpected result)');
      return false;
    }
  } catch (error) {
    console.error('✗ Test FAILED:', error.message);
    return false;
  }
}

async function testSany() {
  console.log('Testing SANY integration...\n');
  console.log('Tools dir:', path.join(__dirname, '..', '..', 'tools'));

  let allPassed = true;

  // Test 1: Invalid spec (should find errors)
  allPassed = await testFile('Simple.tla', false) && allPassed;

  // Test 2: Valid spec (should succeed)
  allPassed = await testFile('SimpleValid.tla', true) && allPassed;

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✓ All SANY integration tests PASSED');
    process.exit(0);
  } else {
    console.log('✗ Some tests FAILED');
    process.exit(1);
  }
}

testSany();
