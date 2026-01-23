/**
 * Utilities for reading TLA+ modules from JAR files.
 * JAR files are ZIP archives; we use adm-zip for reading.
 *
 * URI format: jarfile:<jar-path>!/<inner-path>
 * Example: jarfile:/path/to/tla2tools.jar!/tla2sany/StandardModules/Naturals.tla
 */

export interface ParsedJarfileUri {
  jarPath: string;
  innerPath: string;
}

/**
 * Parse a jarfile: URI into its components.
 * @param uri - URI in format jarfile:<jar-path>!/<inner-path>
 * @returns Parsed jar path and inner path
 * @throws Error if URI is malformed
 */
export function parseJarfileUri(uri: string): ParsedJarfileUri {
  if (!uri.startsWith('jarfile:')) {
    throw new Error(`Invalid jarfile URI: must start with 'jarfile:' - got: ${uri}`);
  }

  const withoutScheme = uri.slice('jarfile:'.length);
  const separatorIndex = withoutScheme.indexOf('!');

  if (separatorIndex === -1) {
    throw new Error(`Invalid jarfile URI: missing '!' separator - got: ${uri}`);
  }

  const jarPath = withoutScheme.slice(0, separatorIndex);
  if (!jarPath) {
    throw new Error(`Invalid jarfile URI: empty jar path - got: ${uri}`);
  }

  // Inner path is after '!' - may have leading '/' which we strip
  let innerPath = withoutScheme.slice(separatorIndex + 1);
  if (innerPath.startsWith('/')) {
    innerPath = innerPath.slice(1);
  }

  return { jarPath, innerPath };
}

/**
 * Check if a string is a jarfile: URI.
 */
export function isJarfileUri(path: string): boolean {
  return path.startsWith('jarfile:');
}
