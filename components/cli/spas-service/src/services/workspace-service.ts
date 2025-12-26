/**
 * WorkspaceService - Service workspace operations
 */

import { existsSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import type { CommandResult } from '../types.js';
import { renderTemplate } from '../utils/templates.js';
import { getSchemaSourcePath } from '../utils/paths.js';

/**
 * WorkspaceService handles service workspace creation and validation
 */
export class WorkspaceService {
  /**
   * Create a new service workspace with folder structure
   *
   * @param workspacePath Absolute path to workspace root
   * @param serviceName Name of the service (for templates)
   * @param force Overwrite existing workspace if true
   * @param projectRoot Optional git root for agent file placement (defaults to workspace parent)
   * @returns CommandResult with success/failure status
   */
  async create(
    workspacePath: string,
    serviceName: string,
    force: boolean = false,
    projectRoot?: string
  ): Promise<CommandResult> {
    try {
      // Check if workspace already exists
      if (existsSync(workspacePath)) {
        if (!force) {
          return {
            success: false,
            message: `Workspace already exists at ${workspacePath}`,
            error: {
              code: 'WORKSPACE_EXISTS',
              details: 'Use --force to overwrite existing workspace',
            },
          };
        }

        // Remove existing workspace
        rmSync(workspacePath, { recursive: true, force: true });
      }

      // Create workspace root directory
      mkdirSync(workspacePath, { recursive: true });

      // Create subdirectories
      const directories = [
        'src',
        'metadata',
        '.spas/schemas',
      ];

      for (const dir of directories) {
        mkdirSync(join(workspacePath, dir), { recursive: true });
      }

      // Create README.md
      const readmeContent = renderTemplate('readme', { serviceName });
      writeFileSync(join(workspacePath, 'README.md'), readmeContent, 'utf-8');

      // Copy design-time-metadata-v1.schema.json from components/schemas/
      const schemaSourcePath = getSchemaSourcePath();
      const schemaDestPath = join(
        workspacePath,
        '.spas',
        'schemas',
        'design-time-metadata-v1.schema.json'
      );

      if (existsSync(schemaSourcePath)) {
        copyFileSync(schemaSourcePath, schemaDestPath);
      } else {
        // Schema not found - return error
        return {
          success: false,
          message: 'design-time-metadata-v1.schema.json not found',
          error: {
            code: 'SCHEMA_NOT_FOUND',
            details: `Expected schema at ${schemaSourcePath}. Reinstall CLI or check installation.`,
          },
        };
      }

      // Create agent and prompt files at project root (.github/agents/ and .github/prompts/)
      // Use provided projectRoot (git root) or fall back to workspace parent
      const effectiveProjectRoot = projectRoot ?? join(workspacePath, '..');
      const agentsDir = join(effectiveProjectRoot, '.github', 'agents');
      const promptsDir = join(effectiveProjectRoot, '.github', 'prompts');

      // Calculate workspaceRoot: the parent directory of the service workspace relative to project root
      // e.g., if projectRoot=/project and workspacePath=/project/services/order-service
      // then workspaceRoot = "./services"
      const workspaceParent = join(workspacePath, '..');
      const workspaceRootRelative = relative(effectiveProjectRoot, workspaceParent);
      const workspaceRoot =
        workspaceRootRelative === '' ? '.' : `./${workspaceRootRelative.replace(/\\/g, '/')}`;

      // Ensure directories exist
      mkdirSync(agentsDir, { recursive: true });
      mkdirSync(promptsDir, { recursive: true });

      // Create agent file (full instructions) with workspaceRoot for NAME: prefix support
      const agentContent = renderTemplate('agent-prompt', { workspaceRoot });
      writeFileSync(
        join(agentsDir, 'spas.service.agent.md'),
        agentContent,
        'utf-8'
      );

      // Create prompt file (trigger)
      const promptContent = renderTemplate('prompt-trigger', {});
      writeFileSync(
        join(promptsDir, 'spas.service.prompt.md'),
        promptContent,
        'utf-8'
      );

      // Calculate relative agent file paths for display
      const agentRelativePath = projectRoot
        ? `${relative(workspacePath, effectiveProjectRoot).replace(/\\/g, '/')}/.github/agents/spas.service.agent.md`
        : '../.github/agents/spas.service.agent.md';
      const promptRelativePath = projectRoot
        ? `${relative(workspacePath, effectiveProjectRoot).replace(/\\/g, '/')}/.github/prompts/spas.service.prompt.md`
        : '../.github/prompts/spas.service.prompt.md';

      return {
        success: true,
        message: `Created service workspace: ${serviceName}`,
        data: {
          name: serviceName,
          path: workspacePath,
          files: [
            `${serviceName}/README.md`,
            `${serviceName}/src/`,
            `${serviceName}/metadata/`,
            `${serviceName}/.spas/schemas/design-time-metadata-v1.schema.json`,
            agentRelativePath,
            promptRelativePath,
          ],
          agentPromptPath: join(agentsDir, 'spas.service.agent.md'),
          promptFilePath: join(promptsDir, 'spas.service.prompt.md'),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create workspace: ${error instanceof Error ? error.message : String(error)}`,
        error: {
          code: 'IO_ERROR',
          details: error instanceof Error ? error.stack || error.message : String(error),
        },
      };
    }
  }
}
