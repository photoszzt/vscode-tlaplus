# TLA+ MCP Server

Model Context Protocol (MCP) server for TLA+ formal specification tools.

## Overview

This package provides a standalone MCP server that exposes TLA+ tools (SANY parser, TLC model checker) and knowledge base resources to MCP clients like Claude Desktop and other AI assistants.

## Features

- **Parse & Validate** - Parse TLA+ specifications using SANY to detect syntax and semantic errors
- **Model Checking** - Run exhaustive model checking with TLC to verify correctness properties
- **Smoke Testing** - Quick random simulation to find violations without exhaustive state exploration
- **Behavior Exploration** - Generate and inspect behavior traces of specified lengths
- **Symbol Extraction** - Extract symbols from TLA+ modules (planned)
- **Module Discovery** - List available TLA+ standard modules
- **Knowledge Base** - Access 20+ articles on TLA+ best practices and common patterns

## Installation

### From Source

```bash
# Clone the vscode-tlaplus repository
git clone https://github.com/tlaplus/vscode-tlaplus.git
cd vscode-tlaplus/packages/mcp-server

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

## Requirements

- **Node.js**: 18.0.0 or higher
- **Java**: 11 or higher (required for TLA+ tools)
- **TLA+ Tools**: tla2tools.jar and CommunityModules-deps.jar

## Usage

### Stdio Mode (for Claude Desktop)

The server runs in stdio mode by default, suitable for Claude Desktop integration:

```bash
tlaplus-mcp-server [options]
```

### HTTP Mode

For remote access or non-stdio clients:

```bash
tlaplus-mcp-server --http --port 3000
```

### CLI Options

- `--http` - Enable HTTP transport (default: stdio)
- `--port <number>` - HTTP server port (default: 3000)
- `--working-dir <path>` - Restrict file access to this directory
- `--tools-dir <path>` - Path to TLA+ tools directory (auto-detected if omitted)
- `--kb-dir <path>` - Path to knowledge base directory (auto-detected if omitted)
- `--java-home <path>` - Path to Java installation (uses system Java if omitted)
- `--verbose` - Enable debug logging
- `--help, -h` - Show help message
- `--version, -v` - Show version

### Examples

```bash
# Start in stdio mode with auto-detection
tlaplus-mcp-server

# Start in HTTP mode with verbose logging
tlaplus-mcp-server --http --port 3000 --verbose

# Specify custom paths
tlaplus-mcp-server --tools-dir /opt/tlaplus/tools --kb-dir /opt/tlaplus/kb

# Restrict to project directory
tlaplus-mcp-server --working-dir /home/user/my-tla-project

# Use specific Java installation
tlaplus-mcp-server --java-home /usr/lib/jvm/java-17-openjdk
```

## Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

### Minimal Configuration

```json
{
  "mcpServers": {
    "tlaplus": {
      "command": "tlaplus-mcp-server"
    }
  }
}
```

### With Custom Paths

```json
{
  "mcpServers": {
    "tlaplus": {
      "command": "tlaplus-mcp-server",
      "args": [
        "--tools-dir", "/path/to/vscode-tlaplus/tools",
        "--kb-dir", "/path/to/vscode-tlaplus/resources/knowledgebase",
        "--verbose"
      ]
    }
  }
}
```

### With Working Directory Restriction

```json
{
  "mcpServers": {
    "tlaplus": {
      "command": "tlaplus-mcp-server",
      "args": ["--working-dir", "/path/to/project"]
    }
  }
}
```

## Available Tools

### SANY Tools

#### `tlaplus_mcp_sany_parse`
Parse a TLA+ module for syntax and semantic errors.

**Parameters:**
- `fileName` (string): Full path to the TLA+ file

**Example:**
```
Parse /path/to/MySpec.tla
```

#### `tlaplus_mcp_sany_symbol`
Extract symbols from a TLA+ module (CONSTANTS, variables, operators).

**Parameters:**
- `fileName` (string): Full path to the TLA+ file
- `includeExtendedModules` (boolean, optional): Include symbols from extended modules

**Note**: Symbol extraction requires XML parsing and will be implemented in a future update.

#### `tlaplus_mcp_sany_modules`
List all available TLA+ standard modules.

**Parameters:** None

**Example:**
```
List available TLA+ modules
```

### TLC Tools

#### `tlaplus_mcp_tlc_check`
Perform exhaustive model checking on a TLA+ specification.

**Parameters:**
- `fileName` (string): Full path to the TLA+ file
- `cfgFile` (string, optional): Path to custom TLC configuration file
- `extraOpts` (array, optional): Additional TLC options
- `extraJavaOpts` (array, optional): Additional Java options

**Example:**
```
Model check /path/to/Counter.tla
```

**Note:** Requires a .cfg file (Counter.cfg or MCCounter.tla/MCCounter.cfg).

#### `tlaplus_mcp_tlc_smoke`
Run a quick smoke test using random simulation (3 seconds).

**Parameters:**
- `fileName` (string): Full path to the TLA+ file
- `cfgFile` (string, optional): Path to custom TLC configuration file
- `extraOpts` (array, optional): Additional TLC options
- `extraJavaOpts` (array, optional): Additional Java options

**Example:**
```
Smoke test /path/to/Counter.tla
```

#### `tlaplus_mcp_tlc_explore`
Generate and print a behavior trace of specified length.

**Parameters:**
- `fileName` (string): Full path to the TLA+ file
- `behaviorLength` (number): Length of behavior to generate
- `cfgFile` (string, optional): Path to custom TLC configuration file
- `extraOpts` (array, optional): Additional TLC options
- `extraJavaOpts` (array, optional): Additional Java options

**Example:**
```
Explore /path/to/Counter.tla with behavior length 5
```

## Knowledge Base Resources

The server exposes 20+ TLA+ knowledge base articles as MCP resources:

- `tla-animations.md` - Understanding TLA+ animations
- `tla-bestpractice-spec-properties.md` - Best practices for specifications
- `tla-choose-nondeterminism.md` - Using CHOOSE for nondeterminism
- `tla-functions-records-sequences.md` - Functions, records, and sequences
- `tla-refinement.md` - Specification refinement
- `tla-review-guidelines.md` - Code review guidelines
- And more...

Resources are accessible via URI: `tlaplus://knowledge/<filename>`

## Troubleshooting

### Java not found

**Error:** `Java executable not found`

**Solutions:**
1. Install Java 11 or higher: https://adoptium.net/
2. Set JAVA_HOME environment variable
3. Use `--java-home /path/to/java` option

### TLA+ tools not found

**Error:** `TLA+ tools jar not found`

**Solutions:**
1. Ensure you're running from the vscode-tlaplus repository with tools/ directory
2. Use `--tools-dir /path/to/tools` to specify the location
3. Verify tla2tools.jar and CommunityModules-deps.jar exist in the tools directory

### Config file not found

**Error:** `No Counter.cfg found`

**Solutions:**
1. Create a .cfg file with the same name as your .tla file
2. Or create MCCounter.tla and MCCounter.cfg files
3. See TLC documentation for config file format

### Permission denied

**Error:** `Access denied: Path is outside the workspace`

**Solution:**
If using `--working-dir`, ensure the file path is within that directory. Otherwise, the server allows access to any file.

## Architecture

The server is organized into:

- **Tools** (`src/tools/`) - MCP tool implementations (SANY, TLC, knowledge base)
- **Utils** (`src/utils/`) - Core utilities (Java execution, TLA+ tools, parsing)
- **Server** (`src/server.ts`) - MCP server with stdio and HTTP transport
- **CLI** (`src/cli.ts`) - Command-line interface and argument parsing

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
node test-sany.js         # Basic SANY integration test
node test-fixtures.js     # Comprehensive test with repository fixtures
```

### Test Results

The server has been thoroughly tested with 10 TLA+ specifications from the vscode-tlaplus test suite:

- ✅ 100% test pass rate
- ✅ Valid specifications parse without errors
- ✅ Invalid specifications correctly report errors
- ✅ Tested with real-world TLA+ code

See [TEST-RESULTS.md](./TEST-RESULTS.md) for detailed test results.

## License

MIT

## Contributing

This package is part of the [vscode-tlaplus](https://github.com/tlaplus/vscode-tlaplus) project. Contributions are welcome!

## Related Projects

- [TLA+ Tools](https://github.com/tlaplus/tlaplus) - The TLA+ specification and verification system
- [VSCode TLA+ Extension](https://github.com/tlaplus/vscode-tlaplus) - TLA+ support for Visual Studio Code
- [Model Context Protocol](https://github.com/modelcontextprotocol) - MCP specification and SDKs
