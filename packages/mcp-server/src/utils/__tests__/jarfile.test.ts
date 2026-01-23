import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { parseJarfileUri, listJarEntries } from '../jarfile';

let tempDir: string;
let testJarPath: string;

beforeAll(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarfile-test-'));
  testJarPath = path.join(tempDir, 'test.jar');

  const zip = new AdmZip();
  zip.addFile('StandardModules/Naturals.tla', Buffer.from('---- MODULE Naturals ----'));
  zip.addFile('StandardModules/Sequences.tla', Buffer.from('---- MODULE Sequences ----'));
  zip.addFile('StandardModules/_TETrace.tla', Buffer.from('---- MODULE _TETrace ----'));
  zip.addFile('StandardModules/README.md', Buffer.from('# Readme'));
  zip.addFile('RootModule.tla', Buffer.from('---- MODULE RootModule ----'));
  zip.addFile('nested/deep/Module.tla', Buffer.from('---- MODULE Module ----'));
  zip.writeZip(testJarPath);
});

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('jarfile utilities', () => {
  describe('parseJarfileUri', () => {
    it('parses a valid jarfile URI', () => {
      const result = parseJarfileUri('jarfile:/path/to/archive.jar!/inner/path/Module.tla');
      expect(result).toEqual({
        jarPath: '/path/to/archive.jar',
        innerPath: 'inner/path/Module.tla',
      });
    });

    it('parses jarfile URI with root inner path', () => {
      const result = parseJarfileUri('jarfile:/path/to/archive.jar!/');
      expect(result).toEqual({
        jarPath: '/path/to/archive.jar',
        innerPath: '',
      });
    });

    it('parses jarfile URI without trailing slash', () => {
      const result = parseJarfileUri('jarfile:/path/to/archive.jar!');
      expect(result).toEqual({
        jarPath: '/path/to/archive.jar',
        innerPath: '',
      });
    });

    it('handles Windows paths', () => {
      const result = parseJarfileUri('jarfile:C:/Users/test/tools/archive.jar!/StandardModules/Naturals.tla');
      expect(result).toEqual({
        jarPath: 'C:/Users/test/tools/archive.jar',
        innerPath: 'StandardModules/Naturals.tla',
      });
    });

    it('throws on missing jarfile: prefix', () => {
      expect(() => parseJarfileUri('/path/to/archive.jar!/inner')).toThrow('Invalid jarfile URI');
    });

    it('throws on missing !/ separator', () => {
      expect(() => parseJarfileUri('jarfile:/path/to/archive.jar')).toThrow('Invalid jarfile URI');
    });

    it('throws on empty jar path', () => {
      expect(() => parseJarfileUri('jarfile:!/inner/path')).toThrow('Invalid jarfile URI');
    });
  });

  describe('listJarEntries', () => {
    it('lists files in a directory', () => {
      const entries = listJarEntries(testJarPath, 'StandardModules');
      expect(entries.sort()).toEqual(['Naturals.tla', 'Sequences.tla', '_TETrace.tla', 'README.md'].sort());
    });

    it('lists files at root level', () => {
      const entries = listJarEntries(testJarPath, '');
      expect(entries).toContain('RootModule.tla');
      expect(entries).not.toContain('nested/deep/Module.tla');
    });

    it('returns empty array for non-existent directory', () => {
      const entries = listJarEntries(testJarPath, 'nonexistent');
      expect(entries).toEqual([]);
    });

    it('throws for non-existent JAR file', () => {
      expect(() => listJarEntries('/nonexistent/path.jar', '')).toThrow();
    });

    it('handles directory path with trailing slash', () => {
      const entries = listJarEntries(testJarPath, 'StandardModules/');
      expect(entries.sort()).toEqual(['Naturals.tla', 'Sequences.tla', '_TETrace.tla', 'README.md'].sort());
    });
  });
});
