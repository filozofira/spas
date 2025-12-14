/**
 * WorkspaceService - Domain workspace operations
 */

import { existsSync, mkdirSync, writeFileSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import type { CommandResult } from '../types.js';
import {
  generateWorkspaceReadme,
  generateChoreographyScaffold,
  generateAgentFile,
  generatePromptFile,
} from '../utils/templates.js';

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
   * @returns CommandResult with success/failure status
   */
  async create(
    workspacePath: string,
    workspaceName: string,
    force: boolean = false
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
        'services',
        join('choreography', 'transformations'),
      ];

      for (const dir of directories) {
        mkdirSync(join(workspacePath, dir), { recursive: true });
      }

      // Create README.md
      const readmeContent = generateWorkspaceReadme(workspaceName);
      writeFileSync(join(workspacePath, 'README.md'), readmeContent, 'utf-8');

      // Create choreography.yaml scaffold
      const choreographyContent = generateChoreographyScaffold(workspaceName);
      writeFileSync(
        join(workspacePath, 'choreography.yaml'),
        choreographyContent,
        'utf-8'
      );

      // Create agent and prompt files at project root (.github/agents/ and .github/prompts/)
      // These are created at the parent of workspace (project root) for VS Code recognition
      const projectRoot = join(workspacePath, '..');
      const agentsDir = join(projectRoot, '.github', 'agents');
      const promptsDir = join(projectRoot, '.github', 'prompts');

      // Ensure directories exist
      mkdirSync(agentsDir, { recursive: true });
      mkdirSync(promptsDir, { recursive: true });

      // Create agent file (full instructions)
      const agentContent = generateAgentFile(workspaceName);
      writeFileSync(
        join(agentsDir, 'spas-compose.agent.md'),
        agentContent,
        'utf-8'
      );

      // Create prompt file (trigger)
      const promptContent = generatePromptFile();
      writeFileSync(
        join(promptsDir, 'spas-compose.prompt.md'),
        promptContent,
        'utf-8'
      );

      return {
        success: true,
        message: `Created domain workspace at ${workspacePath}`,
        data: {
          name: workspaceName,
          path: workspacePath,
          files: [
            'README.md',
            'choreography.yaml',
            'services/',
            'choreography/transformations/',
            '../.github/agents/spas-compose.agent.md',
            '../.github/prompts/spas-compose.prompt.md',
          ],
        },
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Failed to create workspace: ${err.message}`,
        error: {
          code: 'CREATE_FAILED',
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
    const choreographyPath = join(workspacePath, 'choreography.yaml');
    if (!existsSync(choreographyPath)) {
      errors.push('choreography.yaml not found');
    }

    // Check services/ directory exists
    const servicesPath = join(workspacePath, 'services');
    if (!existsSync(servicesPath)) {
      errors.push('services/ directory not found');
    } else {
      try {
        const stats = statSync(servicesPath);
        if (!stats.isDirectory()) {
          errors.push('services/ is not a directory');
        }
      } catch {
        errors.push('Cannot access services/ directory');
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
    const root = '/'; // Unix root (works cross-platform with path.parse)

    while (currentPath !== root) {
      if (existsSync(join(currentPath, 'choreography.yaml'))) {
        return currentPath;
      }

      const parentPath = join(currentPath, '..');
      if (parentPath === currentPath) {
        break; // Reached filesystem root
      }
      currentPath = parentPath;
    }

    return null;
  }
}
