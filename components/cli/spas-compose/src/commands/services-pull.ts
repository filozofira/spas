/**
 * services-pull command handler
 * 
 * Downloads service metadata from SPAS Repository and saves to domain workspace.
 */

import { Command } from 'commander';
import type { ServicesPullOptions } from '../types.js';
import { PullService } from '../services/pull-service.js';
import { WorkspaceService } from '../services/workspace-service.js';
import { RepositoryClient, RepositoryError, RepositoryErrorCode } from '../services/repository-client.js';
import { resolveRepositoryUrl, resolveWorkspacePath, isValidServiceName, isValidVersion } from '../utils/config.js';
import * as output from '../utils/output.js';

/**
 * Exit codes per CLI contract
 */
export enum ServicesPullExitCode {
  SUCCESS = 0,
  NOT_FOUND = 1,
  UNREACHABLE = 2,
  NOT_IN_WORKSPACE = 3,
  FILESYSTEM_ERROR = 4,
}

/**
 * Find workspace root by walking up from current directory
 */
function findWorkspaceRoot(startPath: string): string | null {
  let current = startPath;
  const root = process.platform === 'win32' ? current.split(':')[0] + ':\\' : '/';

  while (current !== root) {
    const workspaceService = new WorkspaceService();
    if (workspaceService.exists(current)) {
      const validation = workspaceService.validate(current);
      if (validation.isValid) {
        return current;
      }
    }
    
    const parent = resolveWorkspacePath('..');
    if (parent === current) break;
    current = parent;
  }

  return null;
}

/**
 * Handle services-pull command
 */
export async function handleServicesPull(
  serviceName: string,
  version: string,
  options: ServicesPullOptions
): Promise<void> {
  // Validate arguments
  if (!isValidServiceName(serviceName)) {
    const result = {
      success: false,
      error: {
        code: 'INVALID_SERVICE_NAME',
        details: 'Service name must be lowercase-hyphenated (e.g., order-service)',
      },
      message: `Invalid service name: ${serviceName}`,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info('Hint: Service names must use lowercase letters, numbers, and hyphens.');
    }
    process.exit(ServicesPullExitCode.NOT_FOUND);
  }

  if (!isValidVersion(version)) {
    const result = {
      success: false,
      error: {
        code: 'INVALID_VERSION',
        details: 'Version must be valid semver (e.g., 1.0.0)',
      },
      message: `Invalid version: ${version}`,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info('Hint: Use semantic versioning format: MAJOR.MINOR.PATCH');
    }
    process.exit(ServicesPullExitCode.NOT_FOUND);
  }

  // Find workspace root (must be in a domain workspace)
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  
  if (!workspaceRoot) {
    const result = {
      success: false,
      error: {
        code: 'NOT_IN_WORKSPACE',
        details: 'Must be run from within a domain workspace',
      },
      message: 'Not in a domain workspace.',
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info('Hint: Run "spas-compose init <name>" to create a workspace first.');
    }
    process.exit(ServicesPullExitCode.NOT_IN_WORKSPACE);
  }

  // Resolve repository URL
  const repositoryUrl = resolveRepositoryUrl(options.repo);

  if (!options.json) {
    output.info(`Downloading ${serviceName}:${version} from ${repositoryUrl}...`);
  }

  // Download from repository
  const client = new RepositoryClient(repositoryUrl);
  
  try {
    const response = await client.downloadService(serviceName, version);

    // Save to workspace
    const pullService = new PullService(workspaceRoot);
    const result = await pullService.saveService(response);

    if (!result.success) {
      if (options.json) {
        output.json(result);
      } else {
        output.error(result.message);
        if (result.error?.details) {
          output.info(`Details: ${result.error.details}`);
        }
      }
      process.exit(ServicesPullExitCode.FILESYSTEM_ERROR);
    }

    // Success output
    if (options.json) {
      output.json(result);
    } else {
      output.success(`Downloaded ${serviceName}:${version}`);
      output.info(`├── spas.json (${formatBytes(result.data!.bytes)})`);
      output.info('└── schemas/');
      for (const schema of result.data!.artifacts.schemas) {
        output.info(`    ├── ${schema}`);
      }
      output.info('');
      output.info(`Saved to ${result.data!.path}/`);
    }

    process.exit(ServicesPullExitCode.SUCCESS);
  } catch (error) {
    if (error instanceof RepositoryError) {
      const result = {
        success: false,
        error: {
          code: error.code,
          details: error.message,
        },
        message: error.message,
      };

      if (options.json) {
        output.json(result);
      } else {
        output.error(error.message);
        if (error.remediation) {
          output.info(`Hint: ${error.remediation}`);
        }
      }

      // Map to exit code
      switch (error.code) {
        case RepositoryErrorCode.NOT_FOUND:
          process.exit(ServicesPullExitCode.NOT_FOUND);
          break;
        case RepositoryErrorCode.UNREACHABLE:
        case RepositoryErrorCode.NETWORK_ERROR:
          process.exit(ServicesPullExitCode.UNREACHABLE);
          break;
        default:
          process.exit(1);
      }
    }

    // Unexpected error
    const result = {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        details: (error as Error).message,
      },
      message: 'An unexpected error occurred',
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      if (options.verbose) {
        console.error(error);
      }
    }
    process.exit(1);
  }
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Create services pull command for Commander.js
 */
export function createServicesPullCommand(): Command {
  const services = new Command('services')
    .description('Service management commands');

  services
    .command('pull')
    .description('Download service metadata from SPAS Repository')
    .argument('<name>', 'Service name to download')
    .argument('<version>', 'Semver version to download')
    .option('--repo <url>', 'Repository URL override')
    .option('--json', 'Output results as JSON', false)
    .action(async (name: string, version: string, options: ServicesPullOptions) => {
      await handleServicesPull(name, version, options);
    });

  return services;
}
