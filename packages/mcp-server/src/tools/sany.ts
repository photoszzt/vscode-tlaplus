import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { ServerConfig } from '../types';
import { resolveAndValidatePath } from '../utils/paths';
import { runSanyParse, parseSanyOutput } from '../utils/sany';
import { extractSymbols } from '../utils/symbols';

/**
 * Register all SANY tools with the MCP server
 * - parse: Parse TLA+ module for syntax errors
 * - symbol: Extract symbols from TLA+ module
 * - modules: List available TLA+ modules
 */
export async function registerSanyTools(
  server: any,
  config: ServerConfig
): Promise<void> {
  // Tool 1: Parse
  server.tool(
    'tlaplus_mcp_sany_parse',
    'Parse the input TLA+ module using SANY from the TLA+ tools. Use SANY to perform syntax and level-checking of the module. Ensure that the input is provided as a fully qualified file path, as required by the tool.',
    {
      fileName: z.string()
    },
    async ({ fileName }: { fileName: string }) => {
      try {
        // Resolve and validate file path
        const absolutePath = resolveAndValidatePath(fileName, config.workingDir);

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
          return {
            content: [{
              type: 'text',
              text: `File ${absolutePath} does not exist on disk.`
            }]
          };
        }

        // Ensure tools directory is configured
        if (!config.toolsDir) {
          return {
            content: [{
              type: 'text',
              text: 'TLA+ tools directory not configured. Use --tools-dir to specify the location.'
            }]
          };
        }

        // Run SANY parser
        const procInfo = await runSanyParse(absolutePath, config.toolsDir, config.javaHome || undefined);
        const result = await parseSanyOutput(procInfo);

        // Format the result
        if (result.success) {
          return {
            content: [{
              type: 'text',
              text: `No errors found in the TLA+ specification ${absolutePath}.`
            }]
          };
        } else {
          const errorMessages = result.errors.map(err => {
            return `Parsing of file ${err.file} failed at line ${err.line} with error: '${err.message}'`;
          });

          return {
            content: [{
              type: 'text',
              text: errorMessages.join('\n')
            }]
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error processing TLA+ specification: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Tool 2: Symbol extraction
  server.tool(
    'tlaplus_mcp_sany_symbol',
    'Extract all symbols from the given TLA+ module. Use this tool to identify the symbols defined in a TLA+ specification—such as when generating a TLC configuration file. It assists in determining the list of CONSTANTS, the initialization predicate, the next-state relation, the overall behavior specification (Spec), and any defined safety or liveness properties. Note: SANY expects the fully qualified file path to the TLA+ module.',
    {
      fileName: z.string().describe('The full path to the file containing the TLA+ module (including jarfile:... paths for modules inside JAR archives).'),
      includeExtendedModules: z.boolean().optional().describe('If true, includes symbols from extended and instantiated modules. By default, only symbols from the current module are included.')
    },
    async ({ fileName, includeExtendedModules }: { fileName: string; includeExtendedModules?: boolean }) => {
      try {
        const absolutePath = resolveAndValidatePath(fileName, config.workingDir);

        if (!fs.existsSync(absolutePath)) {
          return {
            content: [{
              type: 'text',
              text: `File ${absolutePath} does not exist on disk.`
            }]
          };
        }

        if (!config.toolsDir) {
          return {
            content: [{
              type: 'text',
              text: 'TLA+ tools directory not configured. Use --tools-dir to specify the location.'
            }]
          };
        }

        const result = await extractSymbols(
          absolutePath,
          config.toolsDir,
          includeExtendedModules ?? false,
          config.javaHome || undefined
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: 'text',
            text: `Failed to extract symbols: ${errorMessage}\n\nThis may indicate:\n- The TLA+ file has syntax errors (run tlaplus_mcp_sany_parse first)\n- Java is not available or misconfigured\n- The TLA+ tools JAR is missing or corrupted`
          }]
        };
      }
    }
  );

  // Tool 3: List modules
  server.tool(
    'tlaplus_mcp_sany_modules',
    'Retrieves a list of all TLA+ modules recognized by SANY, making it easy to see which modules can be imported into a TLA+ specification.',
    {},
    async () => {
      try {
        // Ensure tools directory is configured
        if (!config.toolsDir) {
          return {
            content: [{
              type: 'text',
              text: 'TLA+ tools directory not configured. Use --tools-dir to specify the location.'
            }]
          };
        }

        const modulesBySearchPath: { [searchPath: string]: string[] } = {};

        // Check standard modules in tools directory
        // For now, we'll just scan filesystem paths (JAR support can be added later)
        const standardModulesPath = path.join(config.toolsDir, 'StandardModules');

        if (fs.existsSync(standardModulesPath)) {
          const files = await fs.promises.readdir(standardModulesPath);
          const tlaFiles = files.filter(file => file.endsWith('.tla'));

          if (tlaFiles.length > 0) {
            modulesBySearchPath[standardModulesPath] = [];
            for (const file of tlaFiles) {
              const moduleName = path.basename(file, '.tla');
              // Skip modules whose name starts with '_'
              if (!moduleName.startsWith('_')) {
                modulesBySearchPath[standardModulesPath].push(
                  `${standardModulesPath}${path.sep}${file}`
                );
              }
            }
          }
        }

        // Format the output
        if (Object.keys(modulesBySearchPath).length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No TLA+ modules found. Standard modules are typically bundled in JAR files. ' +
                'JAR file support will be added in a future update.'
            }]
          };
        }

        const lines: string[] = [];
        for (const [searchPath, modules] of Object.entries(modulesBySearchPath)) {
          lines.push(`\n${searchPath}:`);
          for (const module of modules) {
            lines.push(`  - ${path.basename(module)}`);
          }
        }

        return {
          content: [{
            type: 'text',
            text: `Available TLA+ modules:${lines.join('\n')}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Failed to list modules: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
