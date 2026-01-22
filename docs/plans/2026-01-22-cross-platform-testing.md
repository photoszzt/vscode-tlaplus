# Cross-Platform Testing Implementation Plan

**Goal:** Implement comprehensive cross-platform testing for the TLA+ MCP Server with automated test suite (Jest), CI/CD updates (GitHub Actions), and fixes for 5 platform-specific bugs.

**Architecture:** Add Jest testing framework with TypeScript support, fix critical platform-specific bugs in Java detection (ARM64), path resolution (npm global), process management (Windows signals), and path normalization (Windows). Achieve 80%+ code coverage with unit and integration tests running on Windows, Linux, and macOS in CI.

**Tech Stack:** Jest 29.x, ts-jest, TypeScript 5.x, Node.js 18+, GitHub Actions

**Status:** ✅ ALL PHASES COMPLETE

---

## Phase 1: Test Framework Setup ✅ COMPLETE

### Task 1.1: Add Jest Dependencies ✅ COMPLETE
- Added Jest, @types/jest, ts-jest to devDependencies
- Added test scripts: test, test:watch, test:coverage, test:ci
- **Commit:** `ce6a4d2`

### Task 1.2: Create Jest Configuration ✅ COMPLETE
- Created `jest.config.js` with ts-jest preset
- Configured coverage thresholds (80% lines/statements, 70% branches/functions)
- Scoped coverage to tested utility files
- **Commit:** `ce6a4d2`

### Task 1.3: Create Test Setup File ✅ COMPLETE
- Created `src/__tests__/setup.ts`
- Mocks console.log/error globally for clean test output
- **Commit:** `ce6a4d2`

### Task 1.4: Update TypeScript Config ✅ COMPLETE
- Added Jest types to tsconfig.json
- Included test files in TypeScript compilation
- **Commit:** `ce6a4d2`

---

## Phase 2: Core Platform Bug Fixes ✅ COMPLETE

### Task 2.1: Fix ARM64 Java Detection ✅ COMPLETE
- Added ARM64-specific environment variables (JAVA_HOME_*_ARM64)
- Prioritize ARM64 paths on macOS arm64 architecture
- **Risk Level:** HIGH - Affects all Apple Silicon Mac users
- **Commit:** `c555a92`

### Task 2.2: Fix npm Global Fallback ✅ COMPLETE
- Added `npm root -g` fallback for global installations
- Fixed path logic to resolve within package directory
- Applied to both `autoDetectToolsDir()` and `autoDetectKbDir()`
- **Risk Level:** HIGH - Affects all global npm installations
- **Commit:** `c555a92`

### Task 2.3: Fix Windows Signal Handling ✅ COMPLETE
- Use `taskkill /pid <pid> /T /F` for proper process tree termination
- Added `shell: true` and `windowsHide: true` spawn options
- Fall back to SIGKILL when taskkill fails
- Added optional `timeoutMs` parameter to `runJavaCommand`
- **Risk Level:** HIGH - Affects all Windows users
- **Commit:** `c555a92`

### Task 2.4: Fix Windows Path Normalization ✅ COMPLETE
- Normalize backslashes to forward slashes internally in SANY parser
- Convert back to platform-specific paths in output
- **Risk Level:** MEDIUM - Affects Windows error message paths
- **Commit:** `c555a92`

---

## Phase 3: Unit Tests ✅ COMPLETE

### Task 3.1: Write Unit Tests for paths.ts ✅ COMPLETE
- **Coverage:** 100% (statements, branches, functions, lines)
- Tests: path resolution, validation, monorepo detection, standalone detection, npm global fallback
- **File:** `src/utils/__tests__/paths.test.ts`
- **Commit:** `78d6061`

### Task 3.2: Write Unit Tests for java.ts ✅ COMPLETE
- **Coverage:** 98.23% statements, 97.56% branches, 94.44% functions
- Tests: ARM64/X64 detection, process spawning, cross-platform kill, timeout handling
- 28 tests covering findJavaExecutable, buildJavaOptions, runJavaCommand
- **File:** `src/utils/__tests__/java.test.ts`
- **Commit:** `78d6061`

### Task 3.3: Write Unit Tests for sany.ts ✅ COMPLETE
- **Coverage:** 96.77% statements, 95.23% branches, 71.42% functions
- Tests: Unix/Windows paths, error extraction, SANY output parsing, runSanyParse
- 22 tests covering parseSanyOutput and runSanyParse
- **File:** `src/utils/__tests__/sany.test.ts`
- **Commit:** `78d6061`

### Task 3.4: Write Integration Tests ✅ COMPLETE
- Tests: Full flow findJava → autoDetectToolsDir, error propagation, SANY output parsing
- 9 integration tests for end-to-end utility stack
- **File:** `src/utils/__tests__/integration.test.ts`
- **Commit:** `78d6061`

**Overall Test Results:**
- 4 test suites, 88 tests passing
- Coverage: 98.06% statements, 96.87% branches, 90% functions, 98.41% lines

---

## Phase 4: CI/CD & Documentation ✅ COMPLETE

### Task 4.1: Update GitHub Actions CI ✅ COMPLETE
- Added `test-mcp-server` job to `.github/workflows/ci.yml`
- Test matrix: Windows, Linux, macOS × Node.js 18, 20, 22
- Java 17 (Temurin) setup for all platforms
- Coverage upload to Codecov from Ubuntu + Node 22
- **Commit:** `78d6061`

### Task 4.2: Create TESTING.md ✅ COMPLETE
- Comprehensive testing guide
- Documents: running tests, writing tests, mocking, platform-specific testing
- Coverage requirements and troubleshooting guide
- **File:** `packages/mcp-server/TESTING.md`
- **Commit:** `78d6061`

### Task 4.3: Update README ✅ COMPLETE
- Added CI status and coverage badges
- Added Testing section with commands
- Listed supported platforms (macOS Intel/ARM, Windows, Linux)
- Link to TESTING.md
- **File:** `packages/mcp-server/README.md`
- **Commit:** `78d6061`

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Test Framework Setup | 4/4 | ✅ Complete |
| Phase 2: Platform Bug Fixes | 4/4 | ✅ Complete |
| Phase 3: Unit Tests | 4/4 | ✅ Complete |
| Phase 4: CI/CD & Documentation | 3/3 | ✅ Complete |

**Branch:** `feature/mcp-server-cross-platform-testing`
**Fork:** https://github.com/photoszzt/vscode-tlaplus

**Commits (reorganized):**
1. `f387978` - Add TLA+ MCP Server base implementation
2. `ce6a4d2` - Add Jest testing framework for MCP server
3. `c555a92` - Fix cross-platform bugs in MCP server utilities
4. `78d6061` - Add comprehensive unit tests and CI for MCP server
