/**
 * choreography-deploy command handler
 *
 * Generates Docker Compose deployment from choreography configuration.
 */

import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import type { ChoreographyDeployOptions } from "../types.js";
import { ChoreographyLoader } from "../services/choreography-loader.js";
import { JsonataValidator } from "../services/jsonata-validator.js";
import { DockerGenerator } from "../services/docker-generator.js";
import { SidecarConfigGenerator } from "../services/sidecar-config-generator.js";
import { WorkspaceService } from "../services/workspace-service.js";
import { BackboneNormalizer } from "../services/backbone-normalizer.js";
import * as output from "../utils/output.js";

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
  const root =
    process.platform === "win32" ? current.split(":")[0] + ":\\" : "/";

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
  options: ChoreographyDeployOptions,
): Promise<void> {
  // Must specify --docker for now (only output format supported)
  if (!options.docker) {
    const result = {
      success: false,
      error: {
        code: "MISSING_OUTPUT_FLAG",
        details: "Must specify --docker to generate docker-compose.yaml",
      },
      message: "No output format specified.",
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info("Hint: Use --docker to generate docker-compose.yaml");
    }
    process.exit(1);
  }

  // Find workspace root
  output.verbose(
    "Searching for workspace root from current directory...",
    options.verbose,
  );
  const workspaceRoot = findWorkspaceRoot(process.cwd());

  if (!workspaceRoot) {
    const result = {
      success: false,
      error: {
        code: "NOT_IN_WORKSPACE",
        details: "Must be run from within a domain workspace",
      },
      message: "Not in a domain workspace.",
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info(
        'Hint: Run "spas-compose init <name>" to create a workspace first.',
      );
    }
    process.exit(ChoreographyDeployExitCode.NOT_IN_WORKSPACE);
  }

  output.verbose(`Found workspace root: ${workspaceRoot}`, options.verbose);

  // Load choreography
  output.verbose("Loading choreography.yaml...", options.verbose);
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

  output.verbose(
    `Loaded choreography for domain: ${choreography.domain}`,
    options.verbose,
  );
  output.verbose(
    `Found ${Object.keys(choreography.flows).length} flow(s)`,
    options.verbose,
  );

  // Validate choreography structure
  output.verbose("Validating choreography structure...", options.verbose);
  const validation = loader.validate(choreography);
  if (!validation.isValid) {
    const result = {
      success: false,
      error: {
        code: "INVALID_CHOREOGRAPHY",
        details: validation.errors.join("; "),
      },
      message: "Invalid choreography configuration",
      errors: validation.errors,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      for (const err of validation.errors) {
        output.info(`  • ${err}`);
      }
      output.info("");
      output.info(
        "Hint: Review choreography.yaml and ensure all required fields are present.",
      );
    }
    process.exit(ChoreographyDeployExitCode.INVALID_CHOREOGRAPHY);
  }

  output.verbose("Choreography structure is valid", options.verbose);

  // Validate services are pulled
  output.verbose("Checking for pulled services...", options.verbose);
  const generator = new DockerGenerator(workspaceRoot);
  const serviceValidation = generator.validateServices(choreography);

  if (!serviceValidation.isValid) {
    const result = {
      success: false,
      error: {
        code: "MISSING_SERVICE",
        details: `Missing services: ${serviceValidation.missingServices.join(", ")}`,
      },
      message: "Some services have not been pulled",
      missingServices: serviceValidation.missingServices,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      for (const service of serviceValidation.missingServices) {
        output.info(`  • ${service}`);
      }
      output.info("");
      output.info(
        'Hint: Run "spas-compose services pull <name> <version>" for each missing service.',
      );
    }
    process.exit(ChoreographyDeployExitCode.MISSING_SERVICE);
  }

  output.verbose(
    `Found services: ${serviceValidation.foundServices.join(", ")}`,
    options.verbose,
  );

  // Validate and build backbone configuration
  output.verbose("Building backbone configuration...", options.verbose);
  const backboneNormalizer = new BackboneNormalizer();

  // Validate event backbone image format if provided (skip validation for "none")
  if (options.eventBackbone && options.eventBackbone !== "none") {
    const eventValidation = backboneNormalizer.validateImageFormat(
      options.eventBackbone,
    );
    if (!eventValidation.valid) {
      const result = {
        success: false,
        error: {
          code: "INVALID_IMAGE_FORMAT",
          details: eventValidation.error || "Invalid event backbone image",
        },
        message: `Invalid --event-backbone format: ${options.eventBackbone}`,
      };

      if (options.json) {
        output.json(result);
      } else {
        output.error(result.message);
        output.info("Hint: Use format 'image:tag' or 'org/image:tag'");
      }
      process.exit(1);
    }
  }

  // Validate observability backbone image format if provided (skip validation for "none")
  if (options.observabilityBackbone && options.observabilityBackbone !== "none") {
    const obsValidation = backboneNormalizer.validateImageFormat(
      options.observabilityBackbone,
    );
    if (!obsValidation.valid) {
      const result = {
        success: false,
        error: {
          code: "INVALID_IMAGE_FORMAT",
          details: obsValidation.error || "Invalid observability backbone image",
        },
        message: `Invalid --observability-backbone format: ${options.observabilityBackbone}`,
      };

      if (options.json) {
        output.json(result);
      } else {
        output.error(result.message);
        output.info("Hint: Use format 'image:tag' or 'org/image:tag'");
      }
      process.exit(1);
    }
  }

  const backboneConfig = backboneNormalizer.buildConfig({
    eventBackbone: options.eventBackbone,
    observabilityBackbone: options.observabilityBackbone,
  });

  // Warn when backbones are disabled (BYO infrastructure)
  if (!backboneConfig.eventBackbone.enabled) {
    output.warning(
      "Event backbone disabled. Sidecars will use ${REDIS_HOST} and ${REDIS_PORT} environment variables.",
    );
  }
  if (!backboneConfig.observabilityBackbone.enabled) {
    output.warning(
      "Observability backbone disabled. Services will use ${ZIPKIN_URL} environment variable.",
    );
  }

  output.verbose(
    `Event backbone: ${backboneConfig.eventBackbone.enabled ? backboneConfig.eventBackbone.image : "disabled"}`,
    options.verbose,
  );
  output.verbose(
    `Observability backbone: ${backboneConfig.observabilityBackbone.enabled ? backboneConfig.observabilityBackbone.image : "disabled"}`,
    options.verbose,
  );

  // Validate transformation files
  output.verbose("Validating transformation files...", options.verbose);
  const transformations = loader.getAllTransformations(choreography);
  if (transformations.length > 0) {
    const jsonataValidator = new JsonataValidator();
    const { invalid } = jsonataValidator.validateFiles(
      workspaceRoot,
      transformations,
    );

    if (invalid.length > 0) {
      // Separate missing files from syntax errors
      const missingFiles = invalid.filter((r) =>
        r.errors.some((e) => e.includes("not found")),
      );
      const syntaxErrors = invalid.filter(
        (r) => !r.errors.some((e) => e.includes("not found")),
      );

      if (missingFiles.length > 0) {
        const result = {
          success: false,
          error: {
            code: "MISSING_TRANSFORMATION",
            details: `Missing transformation files: ${missingFiles.map((f) => f.path).join(", ")}`,
          },
          message: "Some transformation files are missing",
          missingFiles: missingFiles.map((f) => f.path),
        };

        if (options.json) {
          output.json(result);
        } else {
          output.error(result.message);
          for (const file of missingFiles) {
            output.info(`  • ${file.path}`);
          }
          output.info("");
          output.info(
            "Hint: Create the transformation files in choreography/transformations/ directory.",
          );
        }
        process.exit(ChoreographyDeployExitCode.MISSING_TRANSFORMATION);
      }

      if (syntaxErrors.length > 0) {
        const result = {
          success: false,
          error: {
            code: "INVALID_JSONATA",
            details: syntaxErrors
              .map((f) => `${f.path}: ${f.errors.join(", ")}`)
              .join("; "),
          },
          message: "Some transformation files have invalid JSONata syntax",
          invalidFiles: syntaxErrors.map((f) => ({
            path: f.path,
            errors: f.errors,
          })),
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
          output.info("");
          output.info(
            "Hint: Check JSONata syntax at https://docs.jsonata.org/",
          );
        }
        process.exit(ChoreographyDeployExitCode.INVALID_JSONATA);
      }
    }
  }

  // Dry run - validate and preview without writing files
  if (options.dryRun) {
    // Generate sidecar configs for preview (T018-T020)
    const sidecarGenerator = new SidecarConfigGenerator(workspaceRoot);
    const configResult = sidecarGenerator.generate(choreography);

    const result = {
      success: true,
      message: "Validation passed",
      data: {
        choreography: {
          domain: choreography.domain,
          flowCount: Object.keys(choreography.flows).length,
        },
        services: serviceValidation.foundServices,
        transformations: transformations,
        // Include backbone configuration for dry-run
        backbone: {
          event: {
            enabled: backboneConfig.eventBackbone.enabled,
            image: backboneConfig.eventBackbone.image,
          },
          observability: {
            enabled: backboneConfig.observabilityBackbone.enabled,
            image: backboneConfig.observabilityBackbone.image,
            type: backboneConfig.observabilityBackbone.type,
          },
        },
        // Include sidecar config preview for dry-run
        sidecarConfigs: {
          totalConfigs: configResult.summary.totalConfigs,
          wouldGenerate: Object.keys(configResult.configs).map(
            (name) => `config.${name}.json`,
          ),
          summary: configResult.summary.services,
        },
      },
    };

    if (options.json) {
      output.json(result);
    } else {
      output.success("Validation passed");
      output.info(`Domain: ${choreography.domain}`);
      output.info(`Flows: ${Object.keys(choreography.flows).length}`);
      output.info(`Services: ${serviceValidation.foundServices.join(", ")}`);
      if (transformations.length > 0) {
        output.info(`Transformations: ${transformations.length} files`);
      }
      output.info("");
      output.info("Backbone configuration:");
      output.info(
        `  • Event: ${backboneConfig.eventBackbone.enabled ? backboneConfig.eventBackbone.image : "disabled"}`,
      );
      output.info(
        `  • Observability: ${backboneConfig.observabilityBackbone.enabled ? `${backboneConfig.observabilityBackbone.image} (${backboneConfig.observabilityBackbone.type})` : "disabled"}`,
      );
      // Show sidecar config preview
      output.info("");
      output.info("Would generate:");
      output.info(`  • docker-compose.yaml`);
      for (const serviceSummary of configResult.summary.services) {
        output.info(
          `  • config.${serviceSummary.name}.json (${serviceSummary.inboundCount} inbound, ${serviceSummary.outboundCount} outbound)`,
        );
      }
      output.info("");
      output.info("No files written (dry run)");
    }
    process.exit(ChoreographyDeployExitCode.SUCCESS);
  }

  // Generate docker-compose.yaml
  output.verbose("Generating docker-compose.yaml...", options.verbose);
  const generateResult = generator.generate(choreography, backboneConfig);

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
      output.info(
        "Hint: Ensure choreography.yaml is valid and all referenced services are pulled.",
      );
    }
    process.exit(1);
  }

  // Write to file
  const outputFile = options.output || "docker-compose.yaml";
  const outputPath = path.join(workspaceRoot, outputFile);

  output.verbose(`Writing output to: ${outputPath}`, options.verbose);

  try {
    fs.writeFileSync(outputPath, generateResult.content!, "utf-8");

    // Generate sidecar config files (T014-T016)
    const sidecarGenerator = new SidecarConfigGenerator(workspaceRoot);
    const configResult = sidecarGenerator.generate(choreography);

    // Write sidecar config files
    const configFiles: string[] = [];
    for (const [serviceName, config] of Object.entries(configResult.configs)) {
      const configFileName = `config.${serviceName}.json`;
      const configPath = path.join(workspaceRoot, configFileName);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      configFiles.push(configFileName);
    }

    const result = {
      success: true,
      message: `Generated ${outputFile} and ${configFiles.length} sidecar config(s)`,
      data: {
        output: outputFile,
        path: outputPath,
        services: serviceValidation.foundServices.length * 2 + 2, // services + sidecars + redis + zipkin
        configs: configFiles,
        configSummary: configResult.summary,
      },
    };

    if (options.json) {
      output.json(result);
    } else {
      output.success(`Generated ${outputFile}`);
      // Show sidecar config generation results
      for (const serviceSummary of configResult.summary.services) {
        output.success(
          `Generated config.${serviceSummary.name}.json (${serviceSummary.inboundCount} inbound, ${serviceSummary.outboundCount} outbound)`,
        );
      }
      output.info("");
      output.info("Next steps:");
      output.info("  • Copy service source to workspace");
      output.info("  • Run: docker compose up");
    }
    process.exit(ChoreographyDeployExitCode.SUCCESS);
  } catch (error) {
    const result = {
      success: false,
      error: {
        code: "WRITE_ERROR",
        details: (error as Error).message,
      },
      message: `Failed to write ${outputFile}`,
    };

    if (options.json) {
      output.json(result);
    } else {
      output.error(result.message);
      output.info(`Details: ${(error as Error).message}`);
      output.info("Hint: Check write permissions and disk space.");
    }
    process.exit(1);
  }
}

/**
 * Create choreography command for Commander.js
 */
export function createChoreographyCommand(): Command {
  const choreography = new Command("choreography").description(
    "Choreography management commands",
  );

  choreography
    .command("deploy")
    .description("Generate deployment artifacts from choreography")
    .option("--docker", "Generate Docker Compose deployment", false)
    .option("--dry-run", "Validate without generating files", false)
    .option("--output <file>", "Output filename", "docker-compose.yaml")
    .option("--json", "Output results as JSON", false)
    .option("--verbose", "Enable verbose output", false)
    .option(
      "--event-backbone <image>",
      "Event backbone image (default: redis:7-alpine, use 'none' to disable)",
    )
    .option(
      "--observability-backbone <image>",
      "Observability backbone image (default: openzipkin/zipkin:latest, use 'none' to disable)",
    )
    .action(async (options: ChoreographyDeployOptions) => {
      await handleChoreographyDeploy(options);
    });

  return choreography;
}
