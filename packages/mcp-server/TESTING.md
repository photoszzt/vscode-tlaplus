# Testing Guide

This document describes how to run and write tests for the TLA+ MCP Server.

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- paths.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="ARM64"
```

### CI Mode

```bash
# Run tests in CI mode (no watch, coverage enabled)
npm run test:ci
```

This command:
- Runs in CI-optimized mode (`--ci` flag)
- Generates coverage reports
- Limits workers to 2 for resource-constrained environments
- Exits with non-zero code on failure

## Test Structure

```
src/
  __tests__/
    setup.ts                    # Global test setup
  utils/
    __tests__/
      paths.test.ts             # Unit tests for paths.ts
      java.test.ts              # Unit tests for java.ts
      sany.test.ts              # Unit tests for sany.ts
      integration.test.ts       # Integration tests
    paths.ts
    java.ts
    sany.ts
```

## Writing Tests

### File Naming

- Unit tests: `<module>.test.ts` in `__tests__` directory
- Test file should be next to the module it tests
- Use descriptive test names that explain the scenario

### Test Structure

```typescript
import { functionToTest } from '../module';

describe('module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('functionToTest', () => {
    it('should do something when given input', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });

    it('should throw error when invalid input', () => {
      expect(() => functionToTest(invalid))
        .toThrow('Expected error message');
    });
  });
});
```

### Mocking

#### Mocking Node.js Modules

```typescript
const mockStat = jest.fn();
const mockExecSync = jest.fn();

jest.mock('fs', () => ({
  promises: {
    stat: (...args: unknown[]) => mockStat(...args)
  }
}));

jest.mock('child_process', () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args)
}));

beforeEach(() => {
  mockStat.mockReset();
  mockExecSync.mockReset();
});
```

#### Mocking process.platform

```typescript
it('handles Windows paths', () => {
  const originalPlatform = process.platform;
  Object.defineProperty(process, 'platform', { 
    value: 'win32', 
    configurable: true 
  });

  // Test Windows-specific behavior

  Object.defineProperty(process, 'platform', { 
    value: originalPlatform, 
    configurable: true 
  });
});
```

#### Mocking process.arch

```typescript
it('prioritizes ARM64 on Apple Silicon', () => {
  const originalArch = process.arch;
  Object.defineProperty(process, 'arch', { 
    value: 'arm64', 
    configurable: true 
  });

  // Test ARM64-specific behavior

  Object.defineProperty(process, 'arch', { 
    value: originalArch, 
    configurable: true 
  });
});
```

### Platform-Specific Testing

Test cross-platform behavior by mocking `process.platform`:

```typescript
describe.each([
  ['linux', '/usr/lib/jvm/java-17/bin/java'],
  ['darwin', '/Library/Java/Home/bin/java'],
  ['win32', 'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe']
])('on %s', (platform, expectedPath) => {
  it('finds Java executable', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { 
      value: platform, 
      configurable: true 
    });

    // Test platform-specific behavior

    Object.defineProperty(process, 'platform', { 
      value: originalPlatform, 
      configurable: true 
    });
  });
});
```

## Coverage Requirements

The project enforces minimum coverage thresholds (see `jest.config.js`):

- **Lines:** 80%
- **Statements:** 80%
- **Branches:** 70%
- **Functions:** 70%

Coverage is measured for:
- `src/utils/paths.ts`
- `src/utils/java.ts`
- `src/utils/sany.ts`

## Continuous Integration

Tests run automatically on:
- Every push to master branch
- Every pull request

CI matrix:
- **Operating Systems:** Windows, Linux (Ubuntu), macOS
- **Node.js Versions:** 18, 20, 22
- **Java Version:** 17 (Temurin distribution)

Coverage reports are uploaded to Codecov from Ubuntu + Node.js 22 jobs.

## Troubleshooting

### Tests fail with "npm not found"

The `paths.test.ts` tests mock `execSync('npm root -g')`. If tests fail with npm-related errors, ensure the mock is set up correctly:

```typescript
mockExecSync.mockReturnValue('/path/to/node_modules\n');
```

### Tests fail with "Java not found"

Integration tests require Java 8+ to be installed. Set `JAVA_HOME` or ensure `java` is in your PATH.

### Tests timeout

If tests timeout (default 10s), they may be waiting for a process that never completes. Check:
1. Mocks are properly set up (don't spawn real processes in unit tests)
2. Async operations have proper cleanup
3. Test timeout is sufficient for slow operations

Increase timeout for specific tests:

```typescript
it('slow test', async () => {
  // ...
}, 30000);
```

### Coverage below threshold

If coverage falls below thresholds, tests will fail. To see uncovered lines:

```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

## Best Practices

1. **Test behavior, not implementation** - Test what functions do, not how they do it
2. **One assertion per test** - Keep tests focused on a single behavior
3. **Arrange-Act-Assert** - Structure tests with setup, execution, verification
4. **Mock external dependencies** - Don't call real APIs, spawn real processes, or access real files
5. **Clean up after tests** - Restore mocks, clear environment variables, reset state
6. **Use descriptive test names** - Test name should describe the scenario and expected outcome
7. **Test edge cases** - Empty inputs, null values, boundary conditions
8. **Test error paths** - Verify functions handle errors gracefully
