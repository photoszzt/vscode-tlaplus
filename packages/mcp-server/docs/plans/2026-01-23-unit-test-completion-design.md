# Unit Test Suite Completion - Design Document

**Date:** 2026-01-23
**Status:** Approved
**Effort:** Low
**Impact:** Medium

## Overview

Complete the remaining unit test work identified in FUTURE-IMPROVEMENTS.md by adding comprehensive test coverage for tool handlers (`src/tools/*.ts`) and server lifecycle (`src/server.ts`), including MCP protocol compliance validation.

## Current State

**Existing Test Coverage:**
- 10 test suites, 151 tests
- Core utilities fully tested: `paths.ts`, `java.ts`, `sany.ts`
- Symbol extraction utilities fully tested
- Coverage: 98% statements, 96% branches, 90% functions

**Remaining Work:**
- Tool handler tests (`sany.ts`, `tlc.ts`, `knowledge.ts`)
- Server lifecycle tests (`server.ts`)
- MCP protocol compliance tests

## Architecture

### Test Structure

Four new test files following colocated pattern:

```
src/
  tools/
    __tests__/
      sany.test.ts      (unit tests, mocked)
      tlc.test.ts       (unit tests, mocked)
      knowledge.test.ts (unit tests, mocked)
  __tests__/
    server.test.ts      (integration tests, real MCP SDK)
    fixtures/           (shared test data)
    helpers/            (mock utilities)
```

### Test Layers

**Unit Layer (Tool Handlers)**
- Deep mocking of MCP server API and all utility functions
- Fast, isolated tests focusing on request validation, error handling, response formatting
- No real file I/O or process spawning
- Tests the glue code between MCP and utilities

**Integration Layer (Server)**
- Real MCP SDK with mocked external dependencies (fs, child_process, network)
- Tests server lifecycle, transport modes (stdio/HTTP), tool/resource registration
- Verifies MCP protocol compliance
- Slower but validates end-to-end integration

### Mocking Strategy

**Tool Tests:**
- Mock `@modelcontextprotocol/sdk/server/mcp.js`
- Mock all utility imports (`utils/sany`, `utils/tlc-helpers`, etc.)
- Capture registered handlers and invoke directly
- Mock fs operations

**Server Tests:**
- Use real `McpServer` from MCP SDK
- Mock only external dependencies: `fs`, `child_process`, network operations
- Mock transports for connection lifecycle tests
- Verify protocol compliance with real SDK

## Tool Handler Unit Tests

### Mock Setup Pattern

Each tool test file mocks the MCP server registration API:

```typescript
const mockTool = jest.fn();
const mockServer = { tool: mockTool };
```

When tools register, capture the handler function and invoke it directly with test inputs. This isolates testing to validation, error handling, and response formatting.

### Test Coverage by File

**sany.test.ts** (~80-100 test cases)

`tlaplus_mcp_sany_parse` tool:
- Valid TLA+ file → success response
- Missing file → file not found error
- Parse errors → formatted error messages
- Missing tools directory → configuration error
- Path resolution (relative, absolute, workspace)

`tlaplus_mcp_sany_symbol` tool:
- Valid extraction → structured symbol JSON
- `includeExtendedModules` flag handling
- File not found error
- Extraction failures → error handling
- Empty module handling

`tlaplus_mcp_sany_modules` tool:
- List modules from filesystem directories
- Handle missing directories
- Empty results (no modules found)
- Path validation errors

**tlc.test.ts** (~60-80 test cases)

`tlaplus_mcp_tlc_check` tool:
- Valid model check with cfg file
- Missing cfg file → helpful error message
- Custom cfg file via `cfgFile` parameter
- `extraOpts` and `extraJavaOpts` passing
- Exit code handling (success, violations, errors)
- MC file discovery (MC*.tla/MC*.cfg)

`tlaplus_mcp_tlc_smoke` tool:
- Random simulation mode
- Worker and seed options
- Depth/state limits
- Output formatting

`tlaplus_mcp_tlc_explore` tool:
- Trace generation
- Depth limits
- Output formatting
- Counterexample parsing

**knowledge.test.ts** (~20-30 test cases)

Resource registration:
- Valid markdown files discovered
- Frontmatter parsing (title, description)
- Resource URI generation (`tlaplus://knowledge/...`)
- Multiple files registered correctly

Resource handlers:
- Content retrieval without frontmatter
- Missing file handling
- MimeType validation (`text/markdown`)

Error scenarios:
- Invalid directory path
- Empty directory (no markdown files)
- Permission errors
- File read failures

### Error Response Validation

All tests verify MCP-compliant error responses:
- Errors return `{ content: [{ type: 'text', text: 'Error message' }] }`
- No thrown exceptions - all errors handled gracefully
- Descriptive error messages that guide users
- Proper error context (file paths, line numbers)

## Server Integration Tests

### Test Structure (server.test.ts)

Four main test suites (~70-85 test cases total):

**1. Server Initialization** (~15-20 tests)

Constructor:
- Config validation and storage
- Logger setup for stdio mode (stderr output)
- Logger setup for HTTP mode (stdout allowed)

`createMCPServer()`:
- McpServer instance creation with correct metadata
- Tool registration (all SANY and TLC tools)
- Resource registration when `kbDir` provided
- No resources when `kbDir` undefined
- Capability configuration (resources enabled)
- All tools registered with correct names
- All tools have valid Zod schemas

**2. Stdio Mode** (~10-15 tests)

`startStdio()`:
- Creates StdioServerTransport
- Calls `server.connect()` with transport
- Server ready logging
- Error handling during transport connection
- Graceful error messages

**3. HTTP Mode** (~25-35 tests)

`startHttp()`:
- Express app creation and configuration
- JSON body parser middleware
- Server listening on configured port
- Logging includes actual port

POST /mcp endpoint:
- Stateless request handling (new server per request)
- Protocol version header fixes (handles duplicate headers)
- StreamableHTTPServerTransport creation
- Request body passed to transport
- Response cleanup on connection close
- Server instance cleanup on close
- Error handling returns JSON-RPC error
- 500 status on internal errors

GET /mcp endpoint:
- Returns 405 Method Not Allowed
- JSON-RPC error response
- Explains stateless mode

DELETE /mcp endpoint:
- Returns 405 Method Not Allowed
- JSON-RPC error response

Server lifecycle:
- Port already in use → error logged and exit
- Successful startup → info logged
- Cleanup on shutdown

**4. MCP Protocol Compliance** (~20-25 tests)

Tool discovery:
- List all registered tools
- Verify tool names match expected set
- Verify tool descriptions present
- Verify Zod schemas properly defined

Tool invocation:
- Call each tool type with valid inputs
- Verify response structure (content array)
- Verify response content type ('text')
- Invalid tool names → error
- Invalid parameters → validation error
- Missing required fields → error

Resource discovery (when kbDir configured):
- List all registered resources
- Verify resource URIs match pattern
- Verify resource metadata (title, description, mimeType)

Resource retrieval:
- Fetch resource content
- Verify markdown content returned
- Verify frontmatter stripped
- Invalid resource URI → error

Error mapping:
- Utility errors mapped to MCP error responses
- No uncaught exceptions
- All errors include descriptive messages

## Test Infrastructure

### Test Fixtures (`src/__tests__/fixtures/`)

Reusable test data shared across tests:

**sample-modules.ts:**
```typescript
export const VALID_TLA_MODULE = `---- MODULE Sample ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
====`;

export const SANY_SUCCESS_XML = `<modules>...</modules>`;
export const SANY_ERROR_OUTPUT = `Parsing failed at line 5...`;

export const TLC_SUCCESS_OUTPUT = [
  'TLC2 Version ...',
  'Model checking completed. No errors.'
];

export const TLC_VIOLATION_OUTPUT = [
  'TLC2 Version ...',
  'Error: Invariant violated...'
];
```

**config-samples.ts:**
```typescript
export const MINIMAL_CONFIG: ServerConfig = {
  toolsDir: '/mock/tools',
  workingDir: '/mock/work',
  verbose: false,
  http: false,
  port: 3000
};

export const HTTP_CONFIG: ServerConfig = {
  ...MINIMAL_CONFIG,
  http: true,
  port: 3000
};

export const FULL_CONFIG: ServerConfig = {
  ...MINIMAL_CONFIG,
  kbDir: '/mock/kb',
  javaHome: '/mock/java',
  verbose: true
};
```

**markdown-samples.ts:**
```typescript
export const MARKDOWN_WITH_FRONTMATTER = `---
title: TLC Configuration
description: Guide to TLC config files
---
# TLC Configuration
...content...`;

export const MARKDOWN_WITHOUT_FRONTMATTER = `# Simple Article
...content...`;
```

### Mock Helpers (`src/__tests__/helpers/`)

**mock-server.ts:**
```typescript
export function createMockMcpServer() {
  const tools = new Map();
  const resources = new Map();

  return {
    tool: jest.fn((name, desc, schema, handler) => {
      tools.set(name, { desc, schema, handler });
    }),
    resource: jest.fn((uri, name, meta, handler) => {
      resources.set(uri, { name, meta, handler });
    }),
    getRegisteredTools: () => tools,
    getRegisteredResources: () => resources,
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined)
  };
}

export async function callRegisteredTool(
  server: ReturnType<typeof createMockMcpServer>,
  toolName: string,
  args: any
) {
  const tool = server.getRegisteredTools().get(toolName);
  if (!tool) throw new Error(`Tool ${toolName} not registered`);
  return await tool.handler(args);
}
```

**assertions.ts:**
```typescript
export function expectMcpTextResponse(response: any, expectedText: string) {
  expect(response.content).toHaveLength(1);
  expect(response.content[0].type).toBe('text');
  expect(response.content[0].text).toContain(expectedText);
}

export function expectMcpErrorResponse(response: any, errorText: string) {
  expect(response.content).toHaveLength(1);
  expect(response.content[0].type).toBe('text');
  expect(response.content[0].text).toContain(errorText);
}

export function expectToolRegistered(
  server: ReturnType<typeof createMockMcpServer>,
  toolName: string
) {
  const tools = server.getRegisteredTools();
  expect(tools.has(toolName)).toBe(true);
}
```

**mock-utils.ts:**
```typescript
export function mockSanySuccess() {
  return {
    runSanyParse: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }),
    parseSanyOutput: jest.fn().mockResolvedValue({ success: true, errors: [] })
  };
}

export function mockSanyError(errorMessage: string) {
  return {
    runSanyParse: jest.fn().mockResolvedValue({ stdout: '', stderr: errorMessage }),
    parseSanyOutput: jest.fn().mockResolvedValue({
      success: false,
      errors: [{ file: 'test.tla', line: 5, message: errorMessage }]
    })
  };
}

export function mockTlcSuccess(output: string[]) {
  return {
    runTlcAndWait: jest.fn().mockResolvedValue({
      exitCode: 0,
      output
    })
  };
}
```

## Jest Configuration Updates

Update `jest.config.js`:

```javascript
collectCoverageFrom: [
  'src/utils/paths.ts',
  'src/utils/java.ts',
  'src/utils/sany.ts',
  'src/tools/*.ts',      // NEW: Tool handlers
  'src/server.ts'        // NEW: Server lifecycle
]
```

Maintain existing thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 80%
- Statements: 80%

## Test Execution Performance

**Expected Performance:**
- Unit tests (tools): ~2-3 seconds (heavily mocked, fast)
- Integration tests (server): ~1-2 seconds (real SDK but mocked I/O)
- Total suite: ~5 seconds (acceptable for CI)

**Test Isolation:**
- Each test file runs independently
- No shared state between tests
- Mock cleanup in `afterEach` hooks
- Parallel execution safe

## Implementation Checklist

### Phase 1: Infrastructure
- [ ] Create `src/__tests__/fixtures/` directory
- [ ] Create `src/__tests__/helpers/` directory
- [ ] Implement sample-modules.ts fixtures
- [ ] Implement config-samples.ts fixtures
- [ ] Implement markdown-samples.ts fixtures
- [ ] Implement mock-server.ts helpers
- [ ] Implement assertions.ts helpers
- [ ] Implement mock-utils.ts helpers

### Phase 2: Tool Handler Tests
- [ ] Create `src/tools/__tests__/sany.test.ts`
  - [ ] tlaplus_mcp_sany_parse tests
  - [ ] tlaplus_mcp_sany_symbol tests
  - [ ] tlaplus_mcp_sany_modules tests
- [ ] Create `src/tools/__tests__/tlc.test.ts`
  - [ ] tlaplus_mcp_tlc_check tests
  - [ ] tlaplus_mcp_tlc_smoke tests
  - [ ] tlaplus_mcp_tlc_explore tests
- [ ] Create `src/tools/__tests__/knowledge.test.ts`
  - [ ] Resource registration tests
  - [ ] Resource handler tests
  - [ ] Error scenario tests

### Phase 3: Server Tests
- [ ] Create `src/__tests__/server.test.ts`
  - [ ] Server initialization tests
  - [ ] Stdio mode tests
  - [ ] HTTP mode tests
  - [ ] MCP protocol compliance tests

### Phase 4: Configuration
- [ ] Update `jest.config.js` coverage configuration
- [ ] Run full test suite and verify coverage meets thresholds
- [ ] Update FUTURE-IMPROVEMENTS.md to mark work complete

### Phase 5: Documentation
- [ ] Update test documentation in README
- [ ] Document test utilities for future contributors
- [ ] Add examples of extending tests for new tools

## Success Criteria

- [ ] All new tests pass
- [ ] Coverage thresholds met for tool handlers and server
- [ ] Test suite completes in under 10 seconds
- [ ] No flaky tests (parallel execution safe)
- [ ] MCP protocol compliance validated
- [ ] CI/CD pipeline passes with new tests

## Future Enhancements

Beyond this design scope, but worth noting:

- **Performance profiling tests**: Measure and enforce latency SLAs for tool operations
- **Chaos testing**: Random failure injection to test error handling robustness
- **Contract testing**: Verify MCP protocol version compatibility
- **Load testing**: Concurrent request handling in HTTP mode
- **Snapshot testing**: Tool output format regression detection

---

**Design Approved:** 2026-01-23
**Implementation Status:** Pending
