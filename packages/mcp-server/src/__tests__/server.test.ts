import { TLAPlusMCPServer } from '../server';
import { ServerConfig } from '../types';
import { MINIMAL_CONFIG, HTTP_CONFIG, FULL_CONFIG } from './fixtures/config-samples';

// Mock MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js');

// Mock tool registration functions
jest.mock('../tools/sany');
jest.mock('../tools/tlc');
jest.mock('../tools/knowledge');

// Mock express
jest.mock('express');

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerSanyTools } from '../tools/sany';
import { registerTlcTools } from '../tools/tlc';
import { registerKnowledgeBaseResources } from '../tools/knowledge';
import express, { Express, Request, Response } from 'express';

describe('TLAPlusMCPServer', () => {
  let mockMcpServer: any;
  let mockStdioTransport: any;
  let mockHttpTransport: any;
  let mockExpressApp: any;
  let mockHttpServer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock McpServer
    mockMcpServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };
    (McpServer as jest.Mock).mockImplementation(() => mockMcpServer);

    // Mock StdioServerTransport
    mockStdioTransport = {};
    (StdioServerTransport as jest.Mock).mockImplementation(() => mockStdioTransport);

    // Mock StreamableHTTPServerTransport
    mockHttpTransport = {
      handleRequest: jest.fn().mockResolvedValue(undefined),
      close: jest.fn()
    };
    (StreamableHTTPServerTransport as jest.Mock).mockImplementation(() => mockHttpTransport);

    // Mock Express
    mockHttpServer = {
      listen: jest.fn((port, callback) => {
        callback();
        return mockHttpServer;
      }),
      on: jest.fn(),
      address: jest.fn(() => ({ port: 3000 }))
    };

    mockExpressApp = {
      use: jest.fn(),
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      listen: jest.fn((port, callback) => {
        callback();
        return mockHttpServer;
      })
    };
    (express as unknown as jest.Mock).mockReturnValue(mockExpressApp);
    (express.json as jest.Mock) = jest.fn();

    // Mock tool registration
    (registerSanyTools as jest.Mock).mockResolvedValue(undefined);
    (registerTlcTools as jest.Mock).mockResolvedValue(undefined);
    (registerKnowledgeBaseResources as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Constructor', () => {
    it('creates server with minimal config', () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      expect(server).toBeInstanceOf(TLAPlusMCPServer);
    });

    it('creates server with full config', () => {
      const server = new TLAPlusMCPServer(FULL_CONFIG);
      expect(server).toBeInstanceOf(TLAPlusMCPServer);
    });

    it('creates server with HTTP config', () => {
      const server = new TLAPlusMCPServer(HTTP_CONFIG);
      expect(server).toBeInstanceOf(TLAPlusMCPServer);
    });
  });

  describe('Server Initialization', () => {
    it('creates MCP server with correct metadata', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(McpServer).toHaveBeenCalledWith(
        {
          name: 'TLA+ MCP Tools',
          version: '1.0.0'
        },
        {
          capabilities: {
            resources: {}
          }
        }
      );
    });

    it('registers SANY tools', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(registerSanyTools).toHaveBeenCalledWith(mockMcpServer, MINIMAL_CONFIG);
    });

    it('registers TLC tools', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(registerTlcTools).toHaveBeenCalledWith(mockMcpServer, MINIMAL_CONFIG);
    });

    it('registers knowledge base resources when kbDir provided', async () => {
      const server = new TLAPlusMCPServer(FULL_CONFIG);
      await server.start();

      expect(registerKnowledgeBaseResources).toHaveBeenCalledWith(
        mockMcpServer,
        FULL_CONFIG.kbDir
      );
    });

    it('skips knowledge base registration when kbDir not provided', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(registerKnowledgeBaseResources).not.toHaveBeenCalled();
    });
  });

  describe('Stdio Mode', () => {
    it('starts server in stdio mode by default', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(StdioServerTransport).toHaveBeenCalledTimes(1);
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockStdioTransport);
    });

    it('does not start HTTP server in stdio mode', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(express).not.toHaveBeenCalled();
    });

    it('connects transport to MCP server', async () => {
      const server = new TLAPlusMCPServer(MINIMAL_CONFIG);
      await server.start();

      expect(mockMcpServer.connect).toHaveBeenCalledTimes(1);
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockStdioTransport);
    });
  });
});
