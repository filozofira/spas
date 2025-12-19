/**
 * WorkspaceService - Domain workspace operations
 */

import { existsSync, mkdirSync, writeFileSync, rmSync, statSync } from "fs";
import { join, relative } from "path";
import type { CommandResult } from "../types.js";
import {
  generateWorkspaceReadme,
  generateChoreographyScaffold,
  generateAgentFile,
  generatePromptFile,
  generateSidecarConfigSchema,
  generateChoreographySchema,
  generateRuntimeMetadataSchema,
} from "../utils/templates.js";

/**
 * Validation result for workspace
 */
export interface WorkspaceValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * WorkspaceService handles domain workspace creation and validation
 */
export class WorkspaceService {
  /**
   * Create a new domain workspace with folder structure
   *
   * @param workspacePath Absolute path to workspace root
   * @param workspaceName Name of the workspace (for templates)
   * @param force Overwrite existing workspace if true
   * @param projectRoot Optional git root for agent file placement (defaults to workspace parent)
   * @returns CommandResult with success/failure status
   */
  async create(
    workspacePath: string,
    workspaceName: string,
    force: boolean = false,
    projectRoot?: string,
  ): Promise<CommandResult> {
    try {
      // Check if workspace already exists
      if (existsSync(workspacePath)) {
        if (!force) {
          return {
            success: false,
            message: `Workspace already exists at ${workspacePath}`,
            error: {
              code: "WORKSPACE_EXISTS",
              details: "Use --force to overwrite existing workspace",
            },
          };
        }

        // Remove existing workspace
        rmSync(workspacePath, { recursive: true, force: true });
      }

      // Create workspace root directory
      mkdirSync(workspacePath, { recursive: true });

      // Create subdirectories
      const directories = ["services", "transformations"];

      for (const dir of directories) {
        mkdirSync(join(workspacePath, dir), { recursive: true });
      }

      // Create README.md
      const readmeContent = generateWorkspaceReadme(workspaceName);
      writeFileSync(join(workspacePath, "README.md"), readmeContent, "utf-8");

      // Create choreography.yaml scaffold
      const choreographyContent = generateChoreographyScaffold(workspaceName);
      writeFileSync(
        join(workspacePath, "choreography.yaml"),
        choreographyContent,
        "utf-8",
      );

      // Create agent and prompt files at project root (.github/agents/ and .github/prompts/)
      // Use provided projectRoot (git root) or fall back to workspace parent
      const effectiveProjectRoot = projectRoot ?? join(workspacePath, "..");
      const agentsDir = join(effectiveProjectRoot, ".github", "agents");
      const promptsDir = join(effectiveProjectRoot, ".github", "prompts");

      // Calculate domainRoot: the parent directory of the domain workspace relative to project root
      // e.g., if projectRoot=/project and workspacePath=/project/examples/ecommerce/public
      // then domainRoot = "./examples/ecommerce" (or "." if workspace is directly under project root)
      const workspaceParent = join(workspacePath, "..");
      const domainRootRelative = relative(effectiveProjectRoot, workspaceParent);
      const domainRoot = domainRootRelative === "" ? "." : `./${domainRootRelative.replace(/\\/g, "/")}`;

      // Ensure directories exist
      mkdirSync(agentsDir, { recursive: true });
      mkdirSync(promptsDir, { recursive: true });

      // Create agent file (full instructions) with domainRoot for DOMAIN: prefix support
      const agentContent = generateAgentFile(domainRoot);
      writeFileSync(
        join(agentsDir, "spas.compose.agent.md"),
        agentContent,
        "utf-8",
      );

      // Create prompt file (trigger)
      const promptContent = generatePromptFile();
      writeFileSync(
        join(promptsDir, "spas.compose.prompt.md"),
        promptContent,
        "utf-8",
      );

      // Create schema files for AI agent reference
      // Schemas are placed in .spas/schemas/ so AI can understand choreography structure and sidecar config mapping
      const schemasDir = join(workspacePath, ".spas", "schemas");
      mkdirSync(schemasDir, { recursive: true });

      const sidecarSchemaContent = generateSidecarConfigSchema();
      writeFileSync(
        join(schemasDir, "sidecar-config-v1.schema.json"),
        sidecarSchemaContent,
        "utf-8",
      );

      const choreographySchemaContent = generateChoreographySchema();
      writeFileSync(
        join(schemasDir, "choreography-v1.schema.json"),
        choreographySchemaContent,
        "utf-8",
      );

      // Generate runtime metadata schema inline
      const runtimeMetadataSchemaContent = generateRuntimeMetadataSchema();
      writeFileSync(
        join(schemasDir, "runtime-metadata-v1.schema.json"),
        runtimeMetadataSchemaContent,
        "utf-8",
      );

      // Calculate relative agent file path for display
      const agentRelativePath = projectRoot
        ? `${relative(workspacePath, effectiveProjectRoot).replace(/\\/g, "/")}/.github/agents/spas.compose.agent.md`
        : "../.github/agents/spas.compose.agent.md";
      const promptRelativePath = projectRoot
        ? `${relative(workspacePath, effectiveProjectRoot).replace(/\\/g, "/")}/.github/prompts/spas.compose.prompt.md`
        : "../.github/prompts/spas.compose.prompt.md";

      return {
        success: true,
        message: `Created domain workspace at ${workspacePath}`,
        data: {
          name: workspaceName,
          path: workspacePath,
          files: [
            "README.md",
            "choreography.yaml",
            "services/",
            "transformations/",
            ".spas/schemas/sidecar-config-v1.schema.json",
            ".spas/schemas/choreography-v1.schema.json",
            ".spas/schemas/runtime-metadata-v1.schema.json",
            agentRelativePath,
            promptRelativePath,
          ],
        },
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Failed to create workspace: ${err.message}`,
        error: {
          code: "CREATE_FAILED",
          details: err.message,
        },
      };
    }
  }

  /**
   * Check if a workspace exists at the given path
   *
   * @param workspacePath Path to check
   * @returns true if workspace folder exists
   */
  exists(workspacePath: string): boolean {
    return existsSync(workspacePath);
  }

  /**
   * Validate that a path is a valid domain workspace
   *
   * Checks for required files and directories:
   * - choreography.yaml
   * - services/ directory
   *
   * @param workspacePath Path to validate
   * @returns Validation result with any errors
   */
  validate(workspacePath: string): WorkspaceValidation {
    const errors: string[] = [];

    // Check choreography.yaml exists
    const choreographyPath = join(workspacePath, "choreography.yaml");
    if (!existsSync(choreographyPath)) {
      errors.push("choreography.yaml not found");
    }

    // Check services/ directory exists
    const servicesPath = join(workspacePath, "services");
    if (!existsSync(servicesPath)) {
      errors.push("services/ directory not found");
    } else {
      try {
        const stats = statSync(servicesPath);
        if (!stats.isDirectory()) {
          errors.push("services/ is not a directory");
        }
      } catch {
        errors.push("Cannot access services/ directory");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the current workspace path by searching upward for choreography.yaml
   *
   * @param startPath Path to start searching from
   * @returns Workspace path or null if not found
   */
  findWorkspaceRoot(startPath: string): string | null {
    let currentPath = startPath;
    const root = "/"; // Unix root (works cross-platform with path.parse)

    while (currentPath !== root) {
      if (existsSync(join(currentPath, "choreography.yaml"))) {
        return currentPath;
      }

      const parentPath = join(currentPath, "..");
      if (parentPath === currentPath) {
        break; // Reached filesystem root
      }
      currentPath = parentPath;
    }

    return null;
  }
}
