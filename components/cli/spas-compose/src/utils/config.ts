/**
 * Configuration resolution utilities
 */

import { homedir } from 'os';
import { resolve, isAbsolute } from 'path';

/**
 * Default SPAS Repository URL
 */
const DEFAULT_REPOSITORY_URL = 'http://localhost:3000';

/**
 * Resolve SPAS Repository URL from options, environment, or default
 * 
 * Priority:
 * 1. --repo flag
 * 2. SPAS_REPOSITORY_URL environment variable
 * 3. Default (http://localhost:3000)
 */
export function resolveRepositoryUrl(repoOption?: string): string {
  if (repoOption) {
    return repoOption;
  }

  if (process.env.SPAS_REPOSITORY_URL) {
    return process.env.SPAS_REPOSITORY_URL;
  }

  return DEFAULT_REPOSITORY_URL;
}

/**
 * Resolve workspace path to absolute path
 * 
 * Handles:
 * - Relative paths (resolved from cwd)
 * - Absolute paths (used as-is)
 * - Tilde expansion (~/ → home directory)
 */
export function resolveWorkspacePath(path: string): string {
  // Expand tilde to home directory
  if (path.startsWith('~/') || path === '~') {
    return resolve(homedir(), path.slice(2));
  }

  // Return absolute paths as-is
  if (isAbsolute(path)) {
    return path;
  }

  // Resolve relative paths from current working directory
  return resolve(process.cwd(), path);
}

/**
 * Get current working directory
 */
export function getCurrentWorkingDirectory(): string {
  return process.cwd();
}

/**
 * Validate workspace name format
 * 
 * Rules:
 * - Lowercase letters, numbers, hyphens
 * - Must start with letter
 * - Must end with letter or number
 */
export function isValidWorkspaceName(name: string): boolean {
  const pattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;
  return pattern.test(name);
}

/**
 * Validate service name format (same as workspace)
 */
export function isValidServiceName(name: string): boolean {
  return isValidWorkspaceName(name);
}

/**
 * Validate semantic version format
 */
export function isValidVersion(version: string): boolean {
  const pattern = /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i;
  return pattern.test(version);
}
