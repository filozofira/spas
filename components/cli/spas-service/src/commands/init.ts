/**
 * Init command - Create a new service workspace
 */

import { Command } from 'commander';
import { resolve } from 'path';
import type { InitOptions } from '../types.js';
import { WorkspaceService } from '../services/workspace-service.js';
import { isValidServiceName, resolveWorkspacePath } from '../utils/config.js';
import { findGitRoot } from '../utils/git.js';
import * as output from '../utils/output.js';

/**
 * Register the init command with Commander
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init <service-name>')
    .description('Create a new service workspace with folder structure and agent files')
    .option('-o, --output <path>', 'Custom output directory', '.')
    .option('-f, --force', 'Overwrite existing workspace', false)
    .option('--json', 'Output JSON instead of human-readable', false)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (serviceName: string, options: InitOptions) => {
      await handleInit(serviceName, options);
    });
}

/**
 * Handle the init command
 */
async function handleInit(serviceName: string, options: InitOptions): Promise<void> {
  try {
    // Verbose logging
    if (options.verbose) {
      output.verboseLog(`Service name: ${serviceName}`, options.verbose);
      output.verboseLog(`Options: ${JSON.stringify(options, null, 2)}`, options.verbose);
    }

    // Validate service name
    if (!isValidServiceName(serviceName)) {
      const errorResult = {
        success: false,
        message: `Invalid service name: ${serviceName}`,
        error: {
          code: 'INVALID_NAME',
          details:
            'Service name must be lowercase, start with a letter, use hyphens (not underscores), and end with a letter or number.',
        },
      };

      if (options.json) {
        output.json(errorResult);
      } else {
        output.error(errorResult.message);
        console.log(
          `  Service name must be lowercase, start with a letter, use hyphens (not underscores), and end with a letter or number.`
        );
        console.log(`  Example: order-service, inventory-service`);
      }

      process.exit(1);
    }

    // Resolve workspace path
    const workspacePath = resolveWorkspacePath(serviceName, options.output);

    if (options.verbose) {
      output.verboseLog(`Workspace path: ${workspacePath}`, options.verbose);
    }

    // Find git root for agent file placement
    const outputDir = options.output ? resolve(options.output) : process.cwd();
    const gitRoot = findGitRoot(outputDir);

    if (options.verbose) {
      output.verboseLog(
        `Git root: ${gitRoot || 'Not in a git repository'}`,
        options.verbose
      );
    }

    // Create workspace
    const workspaceService = new WorkspaceService();
    const result = await workspaceService.create(
      workspacePath,
      serviceName,
      options.force,
      gitRoot || undefined
    );

    // Handle result
    if (!result.success) {
      if (options.json) {
        output.json(result);
      } else {
        output.error(result.message);
        if (result.error?.details) {
          console.log(`  ${result.error.details}`);
        }
      }
      process.exit(1);
    }

    // Success output
    if (options.json) {
      output.json(result);
    } else {
      output.success(result.message);
      console.log('\nWorkspace structure:');
      result.data?.files.forEach((file) => {
        output.listItem(file);
      });

      console.log('\nNext steps:');
      output.listItem(`cd ${serviceName}`);
      output.listItem(
        `/spas.service NAME:${serviceName} STACK:java CONTEXT:orders Scaffold service with CreateOrder command`
      );
    }

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (options.json) {
      output.json({
        success: false,
        message: `Unexpected error: ${errorMessage}`,
        error: {
          code: 'UNKNOWN_ERROR',
          details: error instanceof Error ? error.stack || errorMessage : errorMessage,
        },
      });
    } else {
      output.error(`Unexpected error: ${errorMessage}`);
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }

    process.exit(1);
  }
}
