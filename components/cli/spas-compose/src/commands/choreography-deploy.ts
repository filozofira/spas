/**
 * choreography-deploy command handler
 * 
 * Generates Docker Compose deployment from choreography configuration.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import type { ChoreographyDeployOptions } from '../types.js';
import { ChoreographyLoader } from '../services/choreography-loader.js';
import { JsonataValidator } from '../services/jsonata-validator.js';
import { DockerGenerator } from '../services/docker-generator.js';
import { WorkspaceService } from '../services/workspace-service.js';
import * as output from '../utils/output.js';

/**
 * Exit codes per CLI contract
 */
export enum ChoreographyDeployExitCode {
  SUCCESS = 0,
  INVALID_CHOREOGRAPHY = 1,
  MISSING_SERVICE = 2,
  MISSING_TRANSFORMATION = 3,
  INVALID_JSONATA = 4,
  NOT_IN_WORKSPACE = 5,
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

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

/**
 * Handle choreography deploy command
 */
export async function handleChoreographyDeploy(
  options: ChoreographyDeployOptions
): Promise<void> {
  // Must specify --docker for now (only output format supported)
  if (!options.docker) {
    const result = {
      success: false,
      error: {
        code: 'MISSING_OUTPUT_FLAG',
        details: 'Must specify --docker to generate docker-compose.yaml',
      },
      message: 'No output format specified.',
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info('Hint: Use --docker to generate docker-compose.yaml');
    }
    process.exit(1);
  }

  // Find workspace root
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
    process.exit(ChoreographyDeployExitCode.NOT_IN_WORKSPACE);
  }

  // Load choreography
  const loader = new ChoreographyLoader(workspaceRoot);
  const loadResult = loader.load();

  if (!loadResult.success) {
    const result = {
      success: false,
      error: loadResult.error,
      message: `Failed to load choreography: ${loadResult.error?.details}`,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
    }
    process.exit(ChoreographyDeployExitCode.INVALID_CHOREOGRAPHY);
  }

  const choreography = loadResult.choreography!;

  // Validate choreography structure
  const validation = loader.validate(choreography);
  if (!validation.isValid) {
    const result = {
      success: false,
      error: {
        code: 'INVALID_CHOREOGRAPHY',
        details: validation.errors.join('; '),
      },
      message: 'Invalid choreography configuration',
      errors: validation.errors,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      for (const err of validation.errors) {
        output.info(`  • ${err}`);
      }
    }
    process.exit(ChoreographyDeployExitCode.INVALID_CHOREOGRAPHY);
  }

  // Validate services are pulled
  const generator = new DockerGenerator(workspaceRoot);
  const serviceValidation = generator.validateServices(choreography);

  if (!serviceValidation.isValid) {
    const result = {
      success: false,
      error: {
        code: 'MISSING_SERVICE',
        details: `Missing services: ${serviceValidation.missingServices.join(', ')}`,
      },
      message: 'Some services have not been pulled',
      missingServices: serviceValidation.missingServices,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      for (const service of serviceValidation.missingServices) {
        output.info(`  • ${service}`);
      }
      output.info('');
      output.info('Hint: Run "spas-compose services pull <name> <version>" for each missing service.');
    }
    process.exit(ChoreographyDeployExitCode.MISSING_SERVICE);
  }

  // Validate transformation files
  const transformations = loader.getAllTransformations(choreography);
  if (transformations.length > 0) {
    const jsonataValidator = new JsonataValidator();
    const { invalid } = jsonataValidator.validateFiles(workspaceRoot, transformations);

    if (invalid.length > 0) {
      // Separate missing files from syntax errors
      const missingFiles = invalid.filter((r) =>
        r.errors.some((e) => e.includes('not found'))
      );
      const syntaxErrors = invalid.filter((r) =>
        !r.errors.some((e) => e.includes('not found'))
      );

      if (missingFiles.length > 0) {
        const result = {
          success: false,
          error: {
            code: 'MISSING_TRANSFORMATION',
            details: `Missing transformation files: ${missingFiles.map((f) => f.path).join(', ')}`,
          },
          message: 'Some transformation files are missing',
          missingFiles: missingFiles.map((f) => f.path),
        };

        if (options.json) {
          output.json(result);
        } else {
          output.error(result.message);
          for (const file of missingFiles) {
            output.info(`  • ${file.path}`);
          }
        }
        process.exit(ChoreographyDeployExitCode.MISSING_TRANSFORMATION);
      }

      if (syntaxErrors.length > 0) {
        const result = {
          success: false,
          error: {
            code: 'INVALID_JSONATA',
            details: syntaxErrors.map((f) => `${f.path}: ${f.errors.join(', ')}`).join('; '),
          },
          message: 'Some transformation files have invalid JSONata syntax',
          invalidFiles: syntaxErrors.map((f) => ({ path: f.path, errors: f.errors })),
        };

        if (options.json) {
          output.json(result);
        } else {
          output.error(result.message);
          for (const file of syntaxErrors) {
            output.info(`  • ${file.path}`);
            for (const err of file.errors) {
              output.info(`      ${err}`);
            }
          }
        }
        process.exit(ChoreographyDeployExitCode.INVALID_JSONATA);
      }
    }
  }

  // Dry run - just validate
  if (options.dryRun) {
    const result = {
      success: true,
      message: 'Validation passed',
      data: {
        choreography: {
          domain: choreography.domain,
          flowCount: Object.keys(choreography.flows).length,
        },
        services: serviceValidation.foundServices,
        transformations: transformations,
      },
    };

    if (options.json) {
      output.json(result);
    } else {
      output.success('Validation passed');
      output.info(`Domain: ${choreography.domain}`);
      output.info(`Flows: ${Object.keys(choreography.flows).length}`);
      output.info(`Services: ${serviceValidation.foundServices.join(', ')}`);
      if (transformations.length > 0) {
        output.info(`Transformations: ${transformations.length} files`);
      }
    }
    process.exit(ChoreographyDeployExitCode.SUCCESS);
  }

  // Generate docker-compose.yaml
  const generateResult = generator.generate(choreography);

  if (!generateResult.success) {
    const result = {
      success: false,
      error: generateResult.error,
      message: `Failed to generate docker-compose.yaml: ${generateResult.error?.details}`,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
    }
    process.exit(1);
  }

  // Write to file
  const outputFile = options.output || 'docker-compose.yaml';
  const outputPath = path.join(workspaceRoot, outputFile);

  try {
    fs.writeFileSync(outputPath, generateResult.content!, 'utf-8');

    const result = {
      success: true,
      message: `Generated ${outputFile}`,
      data: {
        output: outputFile,
        path: outputPath,
        services: serviceValidation.foundServices.length * 2 + 2, // services + sidecars + redis + zipkin
      },
    };

    if (options.json) {
      output.json(result);
    } else {
      output.success(`Generated ${outputFile}`);
      output.info('');
      output.info('Next steps:');
      output.info('  • Copy service source to workspace');
      output.info('  • Run: docker compose up');
    }
    process.exit(ChoreographyDeployExitCode.SUCCESS);
  } catch (error) {
    const result = {
      success: false,
      error: {
        code: 'WRITE_ERROR',
        details: (error as Error).message,
      },
      message: `Failed to write ${outputFile}`,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
    }
    process.exit(1);
  }
}

/**
 * Create choreography command for Commander.js
 */
export function createChoreographyCommand(): Command {
  const choreography = new Command('choreography')
    .description('Choreography management commands');

  choreography
    .command('deploy')
    .description('Generate deployment artifacts from choreography')
    .option('--docker', 'Generate Docker Compose deployment', false)
    .option('--dry-run', 'Validate without generating files', false)
    .option('--output <file>', 'Output filename', 'docker-compose.yaml')
    .option('--json', 'Output results as JSON', false)
    .action(async (options: ChoreographyDeployOptions) => {
      await handleChoreographyDeploy(options);
    });

  return choreography;
}
