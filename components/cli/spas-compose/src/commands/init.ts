/**
 * init command handler
 *
 * Creates a new domain workspace with recommended folder structure
 */

import { Command } from "commander";
import { join, resolve } from "path";
import type { InitOptions, CommandResult } from "../types.js";
import { WorkspaceService } from "../services/workspace-service.js";
import { resolveWorkspacePath, isValidWorkspaceName } from "../utils/config.js";
import { findGitRoot } from "../utils/git.js";
import {
  success,
  error,
  info,
  json,
  listItem,
  verbose,
} from "../utils/output.js";

/**
 * Execute init command
 */
async function executeInit(
  workspaceName: string,
  options: InitOptions,
): Promise<CommandResult> {
  const workspaceService = new WorkspaceService();

  verbose(`Validating workspace name: ${workspaceName}`, options.verbose);

  // Validate workspace name
  if (!isValidWorkspaceName(workspaceName)) {
    return {
      success: false,
      message: `Invalid workspace name: ${workspaceName}`,
      error: {
        code: "INVALID_NAME",
        details:
          "Workspace name must be lowercase, start with a letter, use hyphens (not underscores), and end with a letter or number",
      },
    };
  }

  // Resolve workspace path based on --output option
  let workspacePath: string;
  if (options.output) {
    // Use specified output directory
    const outputDir = resolve(options.output);
    workspacePath = join(outputDir, workspaceName);
    verbose(`Using custom output directory: ${outputDir}`, options.verbose);
  } else {
    // Default: current working directory
    workspacePath = resolveWorkspacePath(workspaceName);
  }
  verbose(`Resolved workspace path: ${workspacePath}`, options.verbose);

  // Find git root for agent file placement
  // Start search from output directory or current directory
  const searchStart = options.output ? resolve(options.output) : process.cwd();
  const projectRoot = findGitRoot(searchStart);
  verbose(
    `Project root (git): ${projectRoot ?? "not found (will use workspace parent)"}`,
    options.verbose,
  );

  // Create workspace
  verbose(
    `Creating workspace with force=${options.force ?? false}`,
    options.verbose,
  );
  const result = await workspaceService.create(
    workspacePath,
    workspaceName,
    options.force ?? false,
    projectRoot ?? undefined,
  );

  return result;
}

/**
 * Display result in human-readable format
 */
function displayResult(result: CommandResult): void {
  if (result.success) {
    success(result.message);
    info("");
    info("Workspace structure:");
    if (result.data?.files) {
      for (const file of result.data.files as string[]) {
        listItem(file);
      }
    }
    info("");
    info(`Next steps:`);
    listItem(`cd ${result.data?.name}`);
    listItem("spas-compose services pull <service-name> <version>");
    listItem("/spas.compose Analyze services and generate choreography");
  } else {
    error(result.message);
    if (result.error?.details) {
      info(result.error.details);
    }
  }
}

/**
 * Create init command
 */
export function createInitCommand(): Command {
  const initCommand = new Command("init");

  initCommand
    .description("Initialize a new domain workspace")
    .argument(
      "<workspace-name>",
      "Name of the domain workspace (lowercase, hyphen-separated)",
    )
    .option("-o, --output <path>", "Output directory for domain workspace (default: current directory)")
    .option("-f, --force", "Overwrite existing workspace", false)
    .option("--json", "Output result as JSON", false)
    .option("--verbose", "Enable verbose output", false)
    .action(async (workspaceName: string, options: InitOptions) => {
      try {
        const result = await executeInit(workspaceName, options);

        if (options.json) {
          json(result);
        } else {
          displayResult(result);
        }

        // Exit with appropriate code
        process.exit(result.success ? 0 : 1);
      } catch (err) {
        const errorResult: CommandResult = {
          success: false,
          message: `Unexpected error: ${(err as Error).message}`,
          error: {
            code: "UNEXPECTED_ERROR",
            details: (err as Error).stack,
          },
        };

        if (options.json) {
          json(errorResult);
        } else {
          error(errorResult.message);
        }

        process.exit(1);
      }
    });

  return initCommand;
}

export { executeInit };
