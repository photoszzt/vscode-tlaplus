import { parseJarfileUri } from '../jarfile';

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
});
