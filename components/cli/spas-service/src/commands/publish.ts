/**
 * Publish command - publishes service metadata to Repository
 */

import { Command } from 'commander';
import { ArchiveReader } from '../services/archive-reader.js';
import { RepositoryClient } from '../services/repository-client.js';
import { PublishService } from '../services/publish-service.js';
import { resolveRepositoryUrl } from '../utils/config.js';
import { success, error, info, printError, verbose, printArchiveContents } from '../utils/output.js';
import type { CliError, PublishOptions, RuntimeMetadata } from '../types.js';

/**
 * Create and configure the publish command
 */
export function createPublishCommand(): Command {
  const command = new Command('publish')
    .description('Publish service metadata to the SPAS Repository')
    .requiredOption('--archive <path>', 'Path to local ZIP archive to publish')
    .option('--repo <url>', 'Repository URL (overrides SPAS_REPOSITORY_URL)')
    .option('--dry-run', 'Inspect metadata without publishing to repository')
    .option('--output <dir>', 'Output directory for dry-run archive copy (default: current directory)')
    .option('--image-digest <digest>', 'Docker image SHA256 digest (e.g., sha256:abc123...)')
    .option('--image-repository <repo>', 'Docker image repository (e.g., ghcr.io/org/service)')
    .option('--image-tag <tag>', 'Docker image tag (e.g., 1.0.0, latest)')
    .action(async (options: PublishOptions) => {
      await executePublish(options);
    });

  return command;
}

/**
 * Execute the publish workflow
 */
async function executePublish(options: PublishOptions): Promise<void> {
  try {
    // Resolve repository URL from options, env var, or default
    const repositoryUrl = resolveRepositoryUrl(options.repo);

    // Create service instances
    const archiveReader = new ArchiveReader();
    const repositoryClient = new RepositoryClient(repositoryUrl);
    const publishService = new PublishService(archiveReader, repositoryClient);

    // Build runtime metadata if any flags provided
    const runtimeMetadata: RuntimeMetadata | undefined = 
      (options.imageDigest || options.imageRepository || options.imageTag)
        ? {
            imageDigest: options.imageDigest,
            imageRepository: options.imageRepository,
            imageTag: options.imageTag,
          }
        : undefined;

    if (options.dryRun) {
      await executeArchiveDryRun(options.archive, publishService, options.output);
      return;
    }

    // Archive mode - publish from local ZIP file
    await executeArchivePublish(options.archive, publishService, repositoryUrl, runtimeMetadata);
  } catch (err) {
    handlePublishError(err);
    process.exit(1);
  }
}

async function executeArchiveDryRun(
  archivePath: string,
  publishService: PublishService,
  outputDir?: string
): Promise<void> {
  info('Dry-run mode: Metadata will be inspected but NOT published to repository');
  info(`Reading service metadata from archive: ${archivePath}`);

  const result = await publishService.dryRunFromArchive(archivePath, outputDir);

  success(`Read archive from ${archivePath}`);
  success(`Extracted identity: ${result.identity.id} v${result.identity.version}`);
  success(`Archive copy saved to: ${result.savedPath}`);

  // Display archive contents
  printArchiveContents({
    id: result.identity.id,
    name: result.identity.name || result.identity.id,
    version: result.identity.version
  }, result.schemas);

  info('');
  info('Dry run complete. No changes published to repository.');
}

/**
 * Execute archive mode: publish from local ZIP file
 */
async function executeArchivePublish(
  archivePath: string,
  publishService: PublishService,
  repositoryUrl: string,
  runtimeMetadata?: RuntimeMetadata
): Promise<void> {
  info(`Publishing service metadata from archive: ${archivePath}`);
  info(`Target repository: ${repositoryUrl}`);

  const identity = await publishService.publishFromArchive(archivePath, runtimeMetadata);

  success(`Read archive from ${archivePath}`);
  success(`Extracted identity: ${identity.id} v${identity.version}`);
  success(`Published ${identity.id}:${identity.version} to ${repositoryUrl}`);

  if (runtimeMetadata) {
    if (runtimeMetadata.imageRepository) {
      info(`  Image: ${runtimeMetadata.imageRepository}:${runtimeMetadata.imageTag || 'latest'}`);
    }
    if (runtimeMetadata.imageDigest) {
      info(`  Digest: ${runtimeMetadata.imageDigest}`);
    }
  }
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
