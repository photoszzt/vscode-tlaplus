import { registerSanyTools } from '../sany';
import { createMockMcpServer, callRegisteredTool } from '../../__tests__/helpers/mock-server';
import { expectMcpTextResponse, expectMcpErrorResponse, expectToolRegistered } from '../../__tests__/helpers/assertions';
import { mockSanySuccess, mockSanyError, mockExtractSymbolsSuccess, mockExtractSymbolsError, mockFsExists } from '../../__tests__/helpers/mock-utils';
import { MINIMAL_CONFIG, NO_TOOLS_CONFIG } from '../../__tests__/fixtures/config-samples';

// Mock dependencies
jest.mock('../../utils/paths');
jest.mock('../../utils/sany');
jest.mock('../../utils/symbols');
jest.mock('fs');

import { resolveAndValidatePath } from '../../utils/paths';
import { runSanyParse, parseSanyOutput } from '../../utils/sany';
import { extractSymbols } from '../../utils/symbols';
import * as fs from 'fs';

describe('SANY Tools', () => {
  let mockServer: ReturnType<typeof createMockMcpServer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = createMockMcpServer();
    (resolveAndValidatePath as jest.Mock).mockImplementation((path) => path);
  });

  describe('Tool Registration', () => {
    it('registers all three SANY tools', async () => {
      await registerSanyTools(mockServer, MINIMAL_CONFIG);

      expectToolRegistered(mockServer, 'tlaplus_mcp_sany_parse');
      expectToolRegistered(mockServer, 'tlaplus_mcp_sany_symbol');
      expectToolRegistered(mockServer, 'tlaplus_mcp_sany_modules');

      expect(mockServer.tool).toHaveBeenCalledTimes(3);
    });
  });

  describe('tlaplus_mcp_sany_parse', () => {
    beforeEach(async () => {
      await registerSanyTools(mockServer, MINIMAL_CONFIG);
    });

    it('returns success for valid TLA+ file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockSanySuccess();
      (runSanyParse as jest.Mock).mockImplementation(mocks.runSanyParse);
      (parseSanyOutput as jest.Mock).mockImplementation(mocks.parseSanyOutput);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_parse', {
        fileName: '/mock/test.tla'
      });

      expectMcpTextResponse(response, 'No errors found');
      expect(runSanyParse).toHaveBeenCalledWith(
        '/mock/test.tla',
        MINIMAL_CONFIG.toolsDir,
        undefined
      );
    });

    it('returns error for missing file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_parse', {
        fileName: '/mock/missing.tla'
      });

      expectMcpErrorResponse(response, 'does not exist');
    });

    it('returns parse errors when SANY fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockSanyError('Unexpected token');
      (runSanyParse as jest.Mock).mockImplementation(mocks.runSanyParse);
      (parseSanyOutput as jest.Mock).mockImplementation(mocks.parseSanyOutput);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_parse', {
        fileName: '/mock/error.tla'
      });

      expectMcpErrorResponse(response, 'Parsing of file');
      expectMcpErrorResponse(response, 'line 5');
      expectMcpErrorResponse(response, 'Unexpected token');
    });

    it('returns error when tools directory not configured', async () => {
      await registerSanyTools(mockServer, NO_TOOLS_CONFIG);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_parse', {
        fileName: '/mock/test.tla'
      });

      expectMcpErrorResponse(response, 'tools directory not configured');
    });

    it('handles exceptions gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (runSanyParse as jest.Mock).mockRejectedValue(new Error('Java not found'));

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_parse', {
        fileName: '/mock/test.tla'
      });

      expectMcpErrorResponse(response, 'Error processing TLA+ specification');
      expectMcpErrorResponse(response, 'Java not found');
    });

    it('uses javaHome from config when provided', async () => {
      const configWithJava = { ...MINIMAL_CONFIG, javaHome: '/custom/java' };
      await registerSanyTools(mockServer, configWithJava);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockSanySuccess();
      (runSanyParse as jest.Mock).mockImplementation(mocks.runSanyParse);
      (parseSanyOutput as jest.Mock).mockImplementation(mocks.parseSanyOutput);

      await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_parse', {
        fileName: '/mock/test.tla'
      });

      expect(runSanyParse).toHaveBeenCalledWith(
        '/mock/test.tla',
        configWithJava.toolsDir,
        '/custom/java'
      );
    });
  });

  describe('tlaplus_mcp_sany_symbol', () => {
    beforeEach(async () => {
      await registerSanyTools(mockServer, MINIMAL_CONFIG);
    });

    it('returns symbols for valid TLA+ file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const symbolData = {
        schemaVersion: 1,
        constants: ['N'],
        variables: ['x', 'y'],
        statePredicates: ['Init', 'TypeOK'],
        actionPredicates: ['Next'],
        temporalFormulas: ['Spec'],
        operatorsWithArgs: [],
        theorems: [],
        assumptions: [],
        bestGuess: { init: 'Init', next: 'Next', spec: 'Spec' }
      };
      const mocks = mockExtractSymbolsSuccess(symbolData);
      (extractSymbols as jest.Mock).mockImplementation(mocks.extractSymbols);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/test.tla'
      });

      const parsed = JSON.parse(response.content[0].text);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.constants).toContain('N');
      expect(parsed.variables).toContain('x');
      expect(parsed.bestGuess.init).toBe('Init');
    });

    it('respects includeExtendedModules flag', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockExtractSymbolsSuccess();
      (extractSymbols as jest.Mock).mockImplementation(mocks.extractSymbols);

      await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/test.tla',
        includeExtendedModules: true
      });

      expect(extractSymbols).toHaveBeenCalledWith(
        '/mock/test.tla',
        MINIMAL_CONFIG.toolsDir,
        true,
        undefined
      );
    });

    it('defaults includeExtendedModules to false', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockExtractSymbolsSuccess();
      (extractSymbols as jest.Mock).mockImplementation(mocks.extractSymbols);

      await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/test.tla'
      });

      expect(extractSymbols).toHaveBeenCalledWith(
        '/mock/test.tla',
        MINIMAL_CONFIG.toolsDir,
        false,
        undefined
      );
    });

    it('returns error for missing file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/missing.tla'
      });

      expectMcpErrorResponse(response, 'does not exist');
    });

    it('returns error when tools directory not configured', async () => {
      await registerSanyTools(mockServer, NO_TOOLS_CONFIG);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/test.tla'
      });

      expectMcpErrorResponse(response, 'tools directory not configured');
    });

    it('returns helpful error when extraction fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockExtractSymbolsError('XML parsing failed');
      (extractSymbols as jest.Mock).mockImplementation(mocks.extractSymbols);

      const response = await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/test.tla'
      });

      expectMcpErrorResponse(response, 'Failed to extract symbols');
      expectMcpErrorResponse(response, 'XML parsing failed');
      expectMcpErrorResponse(response, 'This may indicate');
    });

    it('uses javaHome from config', async () => {
      const configWithJava = { ...MINIMAL_CONFIG, javaHome: '/custom/java' };
      await registerSanyTools(mockServer, configWithJava);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mocks = mockExtractSymbolsSuccess();
      (extractSymbols as jest.Mock).mockImplementation(mocks.extractSymbols);

      await callRegisteredTool(mockServer, 'tlaplus_mcp_sany_symbol', {
        fileName: '/mock/test.tla'
      });

      expect(extractSymbols).toHaveBeenCalledWith(
        '/mock/test.tla',
        configWithJava.toolsDir,
        false,
        '/custom/java'
      );
    });
  });
});
