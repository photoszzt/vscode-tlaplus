import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

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
export function isJarfileUri(uriPath: string): boolean {
  return uriPath.startsWith('jarfile:');
}

export function listJarEntries(jarPath: string, innerDir: string): string[] {
  const zip = new AdmZip(jarPath);
  const entries = zip.getEntries();

  let normalizedDir = innerDir.replace(/\\/g, '/');
  if (normalizedDir.endsWith('/')) {
    normalizedDir = normalizedDir.slice(0, -1);
  }

  const prefix = normalizedDir ? normalizedDir + '/' : '';
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryPath = entry.entryName.replace(/\\/g, '/');

    if (prefix) {
      if (!entryPath.startsWith(prefix)) continue;
      const relativePath = entryPath.slice(prefix.length);
      if (relativePath.includes('/')) continue;
      results.push(relativePath);
    } else {
      if (entryPath.includes('/')) continue;
      results.push(entryPath);
    }
  }

  return results;
}

export function listTlaModulesInJar(
  jarPath: string,
  innerDir: string,
  returnFullUri: boolean = false
): string[] {
  const entries = listJarEntries(jarPath, innerDir);

  const tlaModules = entries.filter((name) => {
    if (!name.endsWith('.tla')) return false;
    if (name.startsWith('_')) return false;
    return true;
  });

  if (!returnFullUri) {
    return tlaModules;
  }

  let normalizedDir = innerDir.replace(/\\/g, '/');
  if (normalizedDir.endsWith('/')) {
    normalizedDir = normalizedDir.slice(0, -1);
  }

  return tlaModules.map((name) => {
    const innerPath = normalizedDir ? `${normalizedDir}/${name}` : name;
    return `jarfile:${jarPath}!/${innerPath}`;
  });
}

const extractionCache = new Map<string, string>();

function getCacheDir(): string {
  const cacheBase = path.join(os.tmpdir(), 'tlaplus-mcp', 'jar-cache');
  if (!fs.existsSync(cacheBase)) {
    fs.mkdirSync(cacheBase, { recursive: true });
  }
  return cacheBase;
}

function getCacheKey(jarPath: string, innerPath: string): string {
  const stats = fs.statSync(jarPath);
  const data = `${jarPath}:${stats.mtimeMs}:${innerPath}`;
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

export function clearJarCache(): void {
  extractionCache.clear();
}

export function extractJarEntry(jarPath: string, innerPath: string): string {
  if (innerPath.includes('..') || path.isAbsolute(innerPath)) {
    throw new Error(`Invalid inner path (path traversal rejected): ${innerPath}`);
  }

  const cacheKey = getCacheKey(jarPath, innerPath);

  const cached = extractionCache.get(cacheKey);
  if (cached && fs.existsSync(cached)) {
    return cached;
  }

  const zip = new AdmZip(jarPath);
  const entry = zip.getEntry(innerPath) || zip.getEntry(innerPath.replace(/\//g, '\\'));

  if (!entry) {
    throw new Error(`Entry '${innerPath}' not found in JAR: ${jarPath}`);
  }

  const cacheDir = getCacheDir();
  const extractDir = path.join(cacheDir, cacheKey);
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  const targetPath = path.join(extractDir, path.basename(innerPath));
  fs.writeFileSync(targetPath, entry.getData());

  extractionCache.set(cacheKey, targetPath);
  return targetPath;
}

export function extractJarDirectory(jarPath: string, innerDir: string): string {
  if (innerDir.includes('..') || (innerDir && path.isAbsolute(innerDir))) {
    throw new Error(`Invalid inner path (path traversal rejected): ${innerDir}`);
  }

  const cacheKey = getCacheKey(jarPath, `dir:${innerDir}`);

  const cached = extractionCache.get(cacheKey);
  if (cached && fs.existsSync(cached)) {
    return cached;
  }

  const zip = new AdmZip(jarPath);
  const entries = zip.getEntries();

  let normalizedDir = innerDir.replace(/\\/g, '/');
  if (normalizedDir.endsWith('/')) {
    normalizedDir = normalizedDir.slice(0, -1);
  }
  const prefix = normalizedDir ? normalizedDir + '/' : '';

  const cacheDir = getCacheDir();
  const extractDir = path.join(cacheDir, cacheKey);
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryPath = entry.entryName.replace(/\\/g, '/');
    if (prefix && !entryPath.startsWith(prefix)) continue;

    const relativePath = prefix ? entryPath.slice(prefix.length) : entryPath;

    if (relativePath.includes('..')) continue;

    const targetPath = path.join(extractDir, relativePath);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, entry.getData());
  }

  extractionCache.set(cacheKey, extractDir);
  return extractDir;
}

export function resolveJarfilePath(uri: string): string {
  const { jarPath, innerPath } = parseJarfileUri(uri);

  if (!innerPath) {
    throw new Error(`Cannot resolve jarfile URI without inner path: ${uri}`);
  }

  const innerDir = path.dirname(innerPath).replace(/\\/g, '/');
  const fileName = path.basename(innerPath);

  const normalizedDir = innerDir === '.' ? '' : innerDir;
  const extractedDir = extractJarDirectory(jarPath, normalizedDir);

  return path.join(extractedDir, fileName);
}
