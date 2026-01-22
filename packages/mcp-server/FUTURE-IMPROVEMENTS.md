# Future Improvements

This document tracks potential enhancements and features that could be added to the TLA+ MCP Server in future iterations.

## High Priority

### 1. Complete Symbol Extraction Tool
**Status:** Placeholder implemented
**Effort:** Medium
**Impact:** High

The `tlaplus_mcp_sany_symbol` tool currently returns a message explaining it's not implemented. To complete it:

- Run `tla2sany.xml.XMLExporter` instead of SANY
- Parse XML output to extract symbols
- Group symbols by type (CONSTANTS, VARIABLES, operators, etc.)
- Return structured JSON with all symbol information

**Implementation Path:**
1. Create `src/utils/xml-exporter.ts` with XML execution
2. Add XML parsing library (e.g., `xml2js`)
3. Extract symbol information from parsed XML
4. Update `tlaplus_mcp_sany_symbol` handler in `src/tools/sany.ts`

### 2. JAR Module Scanning
**Status:** Filesystem-only scanning
**Effort:** Medium
**Impact:** Medium

Currently, `tlaplus_mcp_sany_modules` only scans filesystem directories. Standard modules are in JAR files.

**Requirements:**
- Read JAR file entries using JSZip or similar
- Extract .tla files from JAR archives
- Support jarfile:// URI scheme
- Cache JAR contents for performance

**Implementation Path:**
1. Add `jszip` dependency
2. Update `src/utils/modules.ts` with JAR reading
3. Implement caching mechanism
4. Update `tlaplus_mcp_sany_modules` tool

### 3. Unit Test Suite
**Status:** Implemented (utilities + integration); tools/server coverage pending
**Effort:** Medium
**Impact:** High

Automated Jest tests are now in place for the cross-platform utility layer:

- Unit tests cover `src/utils/{paths,java,sany}.ts`
- Integration tests cover key utility workflows
- Java execution is mocked for unit tests
- Coverage thresholds enforced (scoped to core utility files)

Remaining work (optional):
- Add tests for `src/tools/*` and `src/server.ts`
- Add MCP protocol compliance tests (tool registration, schemas, error mapping)

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
**Status:** Basic error handling
**Effort:** Medium
**Impact:** Low

Improve handling of partial failures:

- Retry transient errors
- Graceful degradation when tools unavailable
- Better error context and stack traces
- Structured error codes

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

Last updated: 2026-01-22
