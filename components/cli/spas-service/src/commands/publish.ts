/**
 * Publish command - publishes service metadata to Repository
 */

import { Command } from 'commander';
import { MetadataClient } from '../services/metadata-client.js';
import { ArchiveReader } from '../services/archive-reader.js';
import { RepositoryClient } from '../services/repository-client.js';
import { PublishService } from '../services/publish-service.js';
import { resolveRepositoryUrl } from '../utils/config.js';
import { success, error, info, printError, verbose, printArchiveContents } from '../utils/output.js';
import type { CliError, PublishOptions } from '../types.js';

/**
 * Create and configure the publish command
 */
export function createPublishCommand(): Command {
  const command = new Command('publish')
    .description('Publish service metadata to the SPAS Repository')
    .argument('<service-host>', 'URL of the running service (e.g., http://localhost:5000)')
    .option('--repo <url>', 'Repository URL (overrides SPAS_REPOSITORY_URL)')
    .option('--dry-run', 'Download and inspect metadata without publishing to repository')
    .option('--output <dir>', 'Output directory for dry-run archive (default: current directory)')
    .action(async (serviceHost: string, options: PublishOptions) => {
      await executePublish(serviceHost, options);
    });

  return command;
}

/**
 * Execute the publish workflow
 */
async function executePublish(serviceHost: string, options: PublishOptions): Promise<void> {
  try {
    // Resolve repository URL from options, env var, or default
    const repositoryUrl = resolveRepositoryUrl(options.repo);

    // Create service instances
    const metadataClient = new MetadataClient();
    const archiveReader = new ArchiveReader();
    const repositoryClient = new RepositoryClient(repositoryUrl);
    const publishService = new PublishService(
      metadataClient,
      archiveReader,
      repositoryClient
    );

    if (options.dryRun) {
      // Dry-run mode
      await executeDryRun(serviceHost, publishService, options.output);
    } else {
      // Normal publish mode
      verbose(`Using repository: ${repositoryUrl}`);
      info(`Publishing service metadata from ${serviceHost}`);
      info(`Target repository: ${repositoryUrl}`);

      const identity = await publishService.publish(serviceHost);

      success(`Downloaded metadata from ${serviceHost}`);
      success(`Extracted identity: ${identity.id} v${identity.version}`);
      success(`Published ${identity.id}:${identity.version} to ${repositoryUrl}`);
    }
  } catch (err) {
    handlePublishError(err);
    process.exit(1);
  }
}

/**
 * Execute dry-run workflow: download, inspect, and save locally
 */
async function executeDryRun(
  serviceHost: string,
  publishService: PublishService,
  outputDir?: string
): Promise<void> {
  info('Dry-run mode: Metadata will be downloaded but NOT published to repository');
  info(`Downloading service metadata from ${serviceHost}`);

  const result = await publishService.publishDryRun(serviceHost, outputDir);

  success(`Downloaded metadata from ${serviceHost}`);
  success(`Extracted identity: ${result.identity.id} v${result.identity.version}`);
  success(`Archive saved to: ${result.savedPath}`);

  // Display archive contents
  printArchiveContents({
    id: result.identity.id,
    name: result.identity.name || result.identity.id,
    version: result.identity.version
  }, result.schemas);

  // Final dry-run message
  info('');
  info('Dry run complete. No changes published to repository.');
}

/**
 * Handle publish errors with appropriate messaging
 */
function handlePublishError(err: unknown): void {
  const cliError = err as CliError;

  if (cliError.code) {
    // Known CLI error with code
    printError(cliError);

    // Provide additional context based on error code
    switch (cliError.code) {
      case 'SERVICE_UNAVAILABLE':
        info('Make sure your service is running and accessible at the specified URL.');
        break;
      case 'METADATA_DISABLED':
        info('Ensure the service is running in Development mode with SPAS SDK configured.');
        break;
      case 'REPOSITORY_UNREACHABLE':
        info('Check that the Repository service is running and the URL is correct.');
        break;
      case 'VERSION_CONFLICT':
        info('This version already exists. Use a different version number or delete the existing one.');
        break;
      case 'VALIDATION_ERROR':
        info('The archive failed Repository validation. Check the service metadata configuration.');
        break;
      case 'ARCHIVE_INVALID':
        info('The metadata archive is missing spas.json or contains invalid data.');
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
