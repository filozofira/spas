/**
 * Pull command - downloads service metadata from Repository
 */

import { Command } from 'commander';
import { RepositoryClient } from '../services/repository-client.js';
import { PullService } from '../services/pull-service.js';
import { resolveRepositoryUrl } from '../utils/config.js';
import { success, error, info, printError, verbose } from '../utils/output.js';
import type { CliError, PullOptions } from '../types.js';

/**
 * Create and configure the pull command
 */
export function createPullCommand(): Command {
  const command = new Command('pull')
    .description('Download service metadata from the SPAS Repository')
    .argument('<name>', 'Service name to download (e.g., order-service)')
    .argument('<version>', 'Version to download (e.g., 1.0.0)')
    .option('--repo <url>', 'Repository URL (overrides SPAS_REPOSITORY_URL)')
    .option('--output <dir>', 'Output directory (default: current directory)')
    .action(async (name: string, version: string, options: PullOptions) => {
      await executePull(name, version, options);
    });

  return command;
}

/**
 * Execute the pull workflow
 */
async function executePull(name: string, version: string, options: PullOptions): Promise<void> {
  try {
    // Resolve repository URL from options, env var, or default
    const repositoryUrl = resolveRepositoryUrl(options.repo);
    verbose(`Using repository: ${repositoryUrl}`);

    // Create service instances
    const repositoryClient = new RepositoryClient(repositoryUrl);
    const pullService = new PullService(repositoryClient);

    info(`Downloading ${name}:${version} from ${repositoryUrl}`);

    // Execute pull workflow
    const result = await pullService.pull(name, version, options.output);

    // Success output
    success(`Downloaded ${result.serviceName}:${result.version}`);
    success(`Saved to ${result.savedPath}`);
    info(`Archive size: ${formatBytes(result.bytes)}`);

  } catch (err) {
    handlePullError(err);
    process.exit(1);
  }
}

/**
 * Handle pull errors with appropriate messaging
 */
function handlePullError(err: unknown): void {
  const cliError = err as CliError;

  if (cliError.code) {
    // Known CLI error with code
    printError(cliError);

    // Provide additional context based on error code
    switch (cliError.code) {
      case 'NOT_FOUND':
        info('Verify the service name and version exist in the repository.');
        info('Use the Repository API to list available services and versions.');
        break;
      case 'REPOSITORY_UNREACHABLE':
        info('Check that the Repository service is running and the URL is correct.');
        break;
      default:
        // Generic error
        break;
    }
  } else {
    // Unexpected error
    error('An unexpected error occurred', String(err));
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
