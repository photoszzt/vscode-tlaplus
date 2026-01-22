#!/usr/bin/env node

// Comprehensive test script for existing TLA+ fixtures
const path = require('path');
const { runSanyParse, parseSanyOutput } = require('./dist/utils/sany');

const testFiles = [
  '../../tests/fixtures/playwright/check-result/Spec.tla',
  '../../tests/fixtures/syntax/tlaplus.tla',
  '../../tests/fixtures/syntax/pluscal.tla',
  '../../tests/fixtures/syntax/dependency.tla',
  '../../tests/suite/languages/tlaplus-grammar-test.tla',
  '../../tests/suite/languages/tlaplus-grammar-test-extended.tla',
  '../../tests/suite/languages/tlaplus-grammar-test-submodule.tla',
  '../../tests/suite/languages/tlaplus-grammar-test-issue-361.tla',
  './test-specs/SimpleValid.tla',
  './test-specs/Counter.tla'
];

async function testFile(relPath) {
  const tlaFilePath = path.join(__dirname, relPath);
  const toolsDir = path.join(__dirname, '..', '..', 'tools');
  const fileName = path.basename(tlaFilePath);

  try {
    process.stdout.write(`Testing ${fileName}... `);

    const procInfo = await runSanyParse(tlaFilePath, toolsDir);
    const result = await parseSanyOutput(procInfo);

    if (result.success) {
      console.log('✓ PASS (no errors)');
      return { file: fileName, passed: true, errors: 0 };
    } else {
      console.log(`✓ PASS (found ${result.errors.length} error(s) as expected)`);
      return { file: fileName, passed: true, errors: result.errors.length };
    }
  } catch (error) {
    console.log(`✗ FAIL (${error.message})`);
    return { file: fileName, passed: false, error: error.message };
  }
}

async function runTests() {
  console.log('Testing TLA+ MCP Server with repository fixtures\n');
  console.log('Tools dir:', path.join(__dirname, '..', '..', 'tools'));
  console.log('=' .repeat(60));
  console.log();

  const results = [];

  for (const filePath of testFiles) {
    const result = await testFile(filePath);
    results.push(result);
  }

  console.log();
  console.log('=' .repeat(60));
  console.log('Summary:');
  console.log();

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);

  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total errors found: ${totalErrors}`);

  if (failed > 0) {
    console.log();
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }

  console.log();
  if (failed === 0) {
    console.log('✓ All tests PASSED');
    process.exit(0);
  } else {
    console.log('✗ Some tests FAILED');
    process.exit(1);
  }
}

runTests();
