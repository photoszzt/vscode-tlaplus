# Future Improvements

This document tracks potential enhancements and features that could be added to the TLA+ MCP Server in future iterations.

## High Priority

### 1. Complete Symbol Extraction Tool
**Status:** ✅ Implemented
**Effort:** Medium
**Impact:** High

The `tlaplus_mcp_sany_symbol` tool now:

- Runs `tla2sany.xml.XMLExporter` to extract symbols
- Parses XML output with `fast-xml-parser`
- Groups symbols into TLC-oriented categories (constants, variables, statePredicates, actionPredicates, temporalFormulas, operatorsWithArgs, theorems, assumptions)
- Computes `bestGuess` for Init/Next/Spec with scoring (root module preferred, stdlib down-ranked)
- Supports `includeExtendedModules` option for nested module output
- Returns structured JSON with `schemaVersion: 1` for future compatibility

### 2. JAR Module Scanning
**Status:** ✅ Implemented
**Effort:** Medium
**Impact:** Medium

The `tlaplus_mcp_sany_modules` tool now:

- Scans all module roots from `getModuleSearchPaths(toolsDir)` including `jarfile:` roots
- Lists standard modules from `tla2tools.jar!/tla2sany/StandardModules/`
- Lists community modules from `CommunityModules-deps.jar!/`
- Returns full `jarfile:` URIs that can be passed directly to parse/symbol tools
- Filters `.tla` files and excludes `_` prefixed internal modules

The `tlaplus_mcp_sany_parse` and `tlaplus_mcp_sany_symbol` tools now:

- Accept `jarfile:` URIs as input
- Automatically extract the module and its directory to a temp cache
- Support `EXTENDS` by extracting sibling modules

Implementation uses `adm-zip` for JAR reading with in-memory + on-disk caching for performance.

### 3. Unit Test Suite
**Status:** ✅ Implemented (14 suites, 223 tests)
**Effort:** Complete
**Impact:** High

Comprehensive automated Jest tests are now in place:

**Utilities & Symbol Extraction:**
- Unit tests cover `src/utils/{paths,java,sany}.ts`
- Symbol extraction tests cover XML parsing, grouping, best-guess heuristics
- Integration tests cover key utility workflows
- Java execution is mocked for unit tests

**Tool Handlers:**
- `src/tools/sany.ts` - 19 tests (parse, symbol extraction, module listing)
- `src/tools/tlc.ts` - 18 tests (model checking, smoke tests, behavior exploration)
- `src/tools/knowledge.ts` - 10 tests (resource registration, frontmatter parsing)

**Server Lifecycle:**
- `src/server.ts` - 25 tests (initialization, stdio mode, HTTP mode, MCP protocol compliance)

**Test Infrastructure:**
- Fixtures for sample TLA+ modules, TLC outputs, configs, markdown
- Helpers for mock MCP server, assertions, utility mocks
- Coverage tracking expanded to tools and server
- Coverage thresholds met: 95.31% statements, 88.7% branches, 87.5% functions, 95.45% lines

## Medium Priority

### 4. TLC Statistics Parsing
**Status:** Not implemented
**Effort:** Medium
**Impact:** Medium

Parse and expose TLC model checking statistics:

- States generated
- States queued
- Distinct states
- Depth of behavior
- Execution time
- Memory usage

**Use Cases:**
- Performance monitoring
- Progress tracking
- Resource planning

### 5. Progress Reporting
**Status:** Not implemented
**Effort:** High
**Impact:** Medium

Stream progress updates during long-running operations:

- TLC progress during model checking
- Estimated completion time
- Cancel operation support

**Challenges:**
- MCP protocol support for streaming
- Client compatibility
- State management

### 6. Configuration File Support
**Status:** CLI args only
**Effort:** Low
**Impact:** Low

Add support for configuration files:

```json
{
  "toolsDir": "/opt/tlaplus/tools",
  "kbDir": "/opt/tlaplus/kb",
  "workingDir": "/home/user/project",
  "javaHome": "/usr/lib/jvm/java-17",
  "verbose": true
}
```

**Benefits:**
- Easier configuration management
- Shareable team configurations
- Environment-specific settings

### 7. Error Recovery
**Status:** ✅ Implemented
**Effort:** Complete
**Impact:** High

Comprehensive error recovery system now in place:

**Retry Logic:**
- Automatic retries for transient errors (Java spawn failures, JAR file locks, file system delays)
- Exponential backoff: 100ms → 1s → 10s (max 3 attempts)
- Synchronous retry support for blocking operations

**Structured Error Codes:**
- 17 error codes covering Java, file system, JAR, parse, process, and configuration errors
- Classification as transient (retriable) or permanent (requires user intervention)
- Error code taxonomy in `src/utils/errors/error-codes.ts`

**Enhanced Error Context:**
- `EnhancedError` class with metadata, timestamps, and stack traces
- Retry attempt tracking in error metadata
- Verbose mode (VERBOSE=1 or DEBUG=1) for full stack traces

**Suggested Actions:**
- All errors include actionable remediation steps based on error code
- Context-specific suggestions (e.g., "Install Java 17 or later" for JAVA_NOT_FOUND)
- Retry exhaustion messages when retries fail

**Graceful Degradation:**
- Module scanning continues even if some paths fail
- Partial results with warnings for non-critical failures
- MCP protocol compliance maintained (all errors return text responses)

Implementation:
- `src/utils/errors/` - Error infrastructure (codes, classifier, retry, context)
- `src/tools/sany.ts` - Error formatting for SANY tools
- `src/tools/tlc.ts` - Error formatting for TLC tools
- `docs/ERROR-CODES.md` - Complete error code reference
- 30 new tests for error utilities with 95%+ coverage

## Low Priority

### 8. Docker Image
**Status:** Not implemented
**Effort:** Low
**Impact:** Low

Create Docker image for easy deployment:

```dockerfile
FROM node:18-alpine
# Include Java, TLA+ tools, and MCP server
```

**Benefits:**
- Consistent environment
- Easy deployment
- Isolated dependencies

### 9. npm Publishing
**Status:** Not published
**Effort:** Low
**Impact:** Medium

When ready to publish:

- Choose package name (`@tlaplus/mcp-server`)
- Set up npm organization
- Configure CI/CD for publishing
- Write migration guide

### 10. Cross-Platform Testing
**Status:** CI matrix added; real-world validation pending
**Effort:** Low
**Impact:** Medium

CI now runs the MCP server test suite on:
- Windows, Linux (Ubuntu), macOS
- Node.js 18, 20, 22
- Java 17 (Temurin)

Remaining validation (manual / real-world):
- Verify global install path detection on real Windows/Linux environments
- Verify Java detection on Intel macOS + Apple Silicon macOS
- Verify Windows process termination behavior in real shells (beyond mocks)

### 11. Performance Optimization
**Status:** Not profiled
**Effort:** Medium
**Impact:** Low

Profile and optimize:

- Reduce startup time
- Minimize memory usage
- Optimize parsing algorithms
- Cache expensive operations

### 12. PlusCal Transpilation
**Status:** Not implemented
**Effort:** High
**Impact:** Low

Add PlusCal transpilation before SANY parsing:

- Detect PlusCal code in TLA+ files
- Run `pcal.trans` tool
- Update file with transpiled TLA+
- Parse updated file with SANY

**Complexity:**
- File modification required
- Backup/restore logic
- Error handling for transpilation failures

## Enhancement Ideas

### Developer Experience

1. **Hot Reload** - Watch mode that reloads on file changes
2. **Debug Mode** - Additional logging and diagnostics
3. **Dry Run** - Preview operations without execution
4. **Shell Completion** - Bash/Zsh completion scripts

### Integration

1. **GitHub Actions** - CI workflow examples
2. **VS Code Extension** - Direct integration possibility
3. **Web UI** - Browser-based interface
4. **API Documentation** - OpenAPI/Swagger spec

### Security

1. **Sandboxing** - Run TLA+ tools in isolated environment
2. **Resource Limits** - CPU/memory/time limits
3. **Audit Logging** - Track all operations
4. **Authentication** - HTTP mode authentication

### Monitoring

1. **Metrics Export** - Prometheus/StatsD integration
2. **Health Checks** - Liveness and readiness endpoints
3. **Structured Logging** - JSON log format
4. **Distributed Tracing** - OpenTelemetry integration

## Won't Implement

Features that are explicitly **not** planned:

1. **GUI Application** - Server-only design by choice
2. **Stateful HTTP Sessions** - Complexity not justified
3. **Built-in TLA+ Tools** - Keep tools separate for updates
4. **Database Integration** - File-based operations sufficient
5. **Multi-tenancy** - Single-user/project design

## Contributing

If you'd like to implement any of these improvements:

1. Open an issue to discuss the approach
2. Follow the existing code style
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## Prioritization Criteria

Features are prioritized based on:

1. **Impact** - How much value does it add?
2. **Effort** - How difficult is implementation?
3. **Dependencies** - What else needs to be done first?
4. **User Demand** - How many users need this?
5. **Maintenance** - What's the ongoing cost?

---

Last updated: 2026-01-23
