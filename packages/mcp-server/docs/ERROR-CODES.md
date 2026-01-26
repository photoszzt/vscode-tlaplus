# Error Codes Reference

The TLA+ MCP Server uses structured error codes to provide clear diagnostics and actionable guidance when errors occur. This document lists all error codes, their meanings, and suggested remediation steps.

## Error Code Format

All errors are returned in the following format:

```
Error [ERROR_CODE]: <error message>

Suggested Actions:
- <action 1>
- <action 2>
- ...
```

When errors are retried and exhausted, the response includes:

```
Failed after N retry attempts.
```

In verbose mode (`VERBOSE=1` or `DEBUG=1`), errors also include stack traces.

## Error Classification

Errors are classified as either **transient** (retriable) or **permanent** (not retriable):

- **Transient errors**: Temporary failures that may succeed on retry (e.g., file locks, spawn failures)
- **Permanent errors**: Failures that require user intervention (e.g., missing files, configuration issues)

## Java Errors

### JAVA_NOT_FOUND
**Type**: Permanent
**Retryable**: No

Java executable not found in the specified location or system PATH.

**Common Causes:**
- Java is not installed
- JAVA_HOME points to invalid directory
- Java is not in system PATH

**Suggested Actions:**
- Install Java 17 or later
- Set JAVA_HOME environment variable
- Use --java-home to specify Java location

---

### JAVA_SPAWN_FAILED
**Type**: Transient
**Retryable**: Yes (3 attempts, exponential backoff)

Failed to spawn Java process. This can occur due to temporary resource constraints.

**Common Causes:**
- System resource exhaustion
- Temporary permission issues
- Race conditions in process spawning

**Suggested Actions:**
- Retry the operation (automatic)
- Check system resources (CPU, memory)
- Verify process limits (ulimit on Unix)

---

### JAVA_TIMEOUT
**Type**: Permanent
**Retryable**: No

Java process exceeded the specified timeout.

**Common Causes:**
- Complex specification taking too long to process
- Insufficient timeout value
- Infinite loop or hang in Java process

**Suggested Actions:**
- Increase timeout value
- Simplify the specification
- Check for infinite loops in TLA+ code

## File System Errors

### FILE_NOT_FOUND
**Type**: Permanent
**Retryable**: No

The specified file does not exist.

**Common Causes:**
- Incorrect file path
- File was deleted
- Typo in filename

**Suggested Actions:**
- Verify the file path is correct
- Check file permissions
- Ensure the file exists on disk

---

### FILE_ACCESS_DENIED
**Type**: Permanent
**Retryable**: No

Insufficient permissions to access the file.

**Common Causes:**
- File ownership issues
- Permission bits too restrictive
- File locked by another process

**Suggested Actions:**
- Check file permissions (chmod on Unix)
- Verify you have read/write access
- Close other programs using the file

---

### FILE_PATH_TRAVERSAL
**Type**: Permanent
**Retryable**: No

Attempted path traversal attack detected (security protection).

**Common Causes:**
- Path contains '..' components
- Absolute path where relative expected
- Malformed jarfile URI

**Suggested Actions:**
- Use relative paths from working directory
- Avoid '..' in paths
- Check jarfile URI format

---

### FILE_IO_ERROR
**Type**: Transient
**Retryable**: Yes (3 attempts, exponential backoff)

Generic I/O error during file operation.

**Common Causes:**
- Disk full
- Network filesystem issues
- Temporary I/O failures

**Suggested Actions:**
- Check available disk space
- Verify filesystem is mounted
- Retry the operation (automatic)

---

### FILE_BUSY
**Type**: Transient
**Retryable**: Yes (3 attempts, exponential backoff)

File is locked or in use by another process.

**Common Causes:**
- Another process has the file open
- Antivirus scanning the file
- File system lock

**Suggested Actions:**
- Close other programs using the file
- Wait for antivirus scan to complete
- Retry the operation (automatic)

## JAR File Errors

### JAR_CORRUPTED
**Type**: Permanent
**Retryable**: No

JAR file is corrupted or malformed.

**Common Causes:**
- Incomplete download
- Disk corruption
- Invalid ZIP structure

**Suggested Actions:**
- Re-download the TLA+ tools
- Verify JAR file integrity
- Check for disk errors

---

### JAR_ENTRY_NOT_FOUND
**Type**: Permanent
**Retryable**: No

The specified entry does not exist in the JAR file.

**Common Causes:**
- Incorrect inner path in jarfile URI
- Module not in JAR
- Wrong JAR file

**Suggested Actions:**
- Verify the jarfile URI is correct
- Check that the JAR file contains the expected module
- List JAR contents with `unzip -l` or similar

---

### JAR_INVALID_URI
**Type**: Permanent
**Retryable**: No

Malformed jarfile URI.

**Common Causes:**
- Missing 'jarfile:' prefix
- Missing '!' separator
- Invalid path syntax

**Suggested Actions:**
- Use format: `jarfile:/path/to/file.jar!/inner/path.tla`
- Ensure '!' separator is present
- Check for typos in URI

---

### JAR_EXTRACTION_FAILED
**Type**: Transient
**Retryable**: Yes (3 attempts, exponential backoff)

Failed to extract entry from JAR file.

**Common Causes:**
- Disk full during extraction
- Permission issues on temp directory
- I/O errors during write

**Suggested Actions:**
- Check available disk space
- Verify write permissions to temp directory
- Retry the operation (automatic)

---

### JAR_LOCKED
**Type**: Transient
**Retryable**: Yes (3 attempts, exponential backoff)

JAR file is locked by another process.

**Common Causes:**
- Another process has JAR open
- Antivirus scanning JAR
- File system lock

**Suggested Actions:**
- Close other programs using the JAR file
- Check for antivirus software locking files
- Retry the operation (automatic)

## Parse Errors

### PARSE_SYNTAX_ERROR
**Type**: Permanent
**Retryable**: No

Syntax error in TLA+ specification.

**Common Causes:**
- Invalid TLA+ syntax
- Missing keywords
- Malformed expressions

**Suggested Actions:**
- Review SANY error messages
- Fix syntax errors in TLA+ file
- Consult TLA+ language reference

---

### PARSE_XML_MALFORMED
**Type**: Permanent
**Retryable**: No

SANY XML output is malformed or unparseable.

**Common Causes:**
- SANY version mismatch
- Corrupted XML output
- Encoding issues

**Suggested Actions:**
- Update TLA+ tools to latest version
- Check SANY output manually
- Report issue if persistent

## Process Errors

### PROCESS_SPAWN_FAILED
**Type**: Transient
**Retryable**: Yes (3 attempts, exponential backoff)

Failed to spawn child process.

**Common Causes:**
- System resource limits
- Temporary permission issues
- Process table full

**Suggested Actions:**
- Check system resources
- Verify process limits (ulimit)
- Retry the operation (automatic)

---

### PROCESS_TIMEOUT
**Type**: Permanent
**Retryable**: No

Child process exceeded timeout.

**Common Causes:**
- Operation taking too long
- Process hung or deadlocked
- Insufficient timeout value

**Suggested Actions:**
- Increase timeout if needed
- Check for infinite loops
- Simplify the operation

## Configuration Errors

### CONFIG_TOOLS_NOT_FOUND
**Type**: Permanent
**Retryable**: No

TLA+ tools directory not configured or tla2tools.jar not found.

**Common Causes:**
- --tools-dir not specified
- tla2tools.jar missing
- Incorrect path

**Suggested Actions:**
- Use --tools-dir to specify TLA+ tools location
- Ensure tla2tools.jar exists in tools directory
- Verify the path is correct

---

### CONFIG_INVALID_PATH
**Type**: Permanent
**Retryable**: No

Configuration contains invalid or malformed path.

**Common Causes:**
- Typo in path
- Path contains invalid characters
- Relative path from wrong directory

**Suggested Actions:**
- Verify all paths in configuration
- Use absolute paths when possible
- Check for typos

## Retry Behavior

Transient errors are automatically retried with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: 100ms delay
- **Attempt 3**: 1s delay
- **Attempt 4**: 10s delay (max)

After 3 failed attempts, the error is returned with retry metadata.

## Verbose Mode

Enable verbose error reporting with environment variables:

```bash
VERBOSE=1 npx @tlaplus/mcp-server ...
# or
DEBUG=1 npx @tlaplus/mcp-server ...
```

Verbose mode includes:
- Full stack traces
- Detailed error context
- Retry attempt information

## Examples

### Example 1: Missing Java

```
Error [JAVA_NOT_FOUND]: Java executable not found in "/invalid/path"

Suggested Actions:
- Install Java 17 or later
- Set JAVA_HOME environment variable
- Use --java-home to specify Java location
```

### Example 2: File Locked (with retry)

```
Error [JAR_LOCKED]: Cannot access /path/to/tla2tools.jar

Suggested Actions:
- Close other programs using the JAR file
- Check for antivirus software locking files

Failed after 3 retry attempts.
```

### Example 3: Syntax Error

```
Error [PARSE_SYNTAX_ERROR]: Parsing of file test.tla failed at line 42 with error: 'Expected operator'

Suggested Actions:
- Review SANY error messages
- Fix syntax errors in TLA+ file
- Consult TLA+ language reference
```
