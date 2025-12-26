/**
 * Configuration resolver for CLI
 * Resolves repository URL from multiple sources with priority
 */

import type { CliConfig } from '../types.js';

/**
 * Resolve repository URL from multiple sources
 * Priority: 1. --repo flag, 2. SPAS_REPOSITORY_URL env var, 3. Default
 *
 * @param repoFlag - Repository URL from --repo command-line flag
 * @returns Resolved repository URL string
 */
export function resolveRepositoryUrl(repoFlag?: string): string {
  const url = (repoFlag?.trim() || '') || 
    process.env.SPAS_REPOSITORY_URL || 
    'http://localhost:3000';
  
  return normalizeUrl(url);
}

/**
 * Resolve repository URL from multiple sources
 * Priority: 1. --repo flag, 2. SPAS_REPOSITORY_URL env var, 3. Default
 *
 * @param repoFlag - Repository URL from --repo command-line flag
 * @returns Resolved CLI configuration
 */
export function resolveConfig(repoFlag?: string): CliConfig {
  return {
    repositoryUrl: resolveRepositoryUrl(repoFlag),
  };
}

/**
 * Normalize URL by removing trailing slash
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Validate that a URL is well-formed
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Service name validation pattern
 * - Lowercase letters and numbers only
 * - Hyphen-separated words (no underscores)
 * - Starts with a letter
 * - Ends with a letter or number
 */
const SERVICE_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Validate a service name against SPAS naming conventions
 * 
 * @param name Service name to validate
 * @returns true if valid, false otherwise
 */
export function isValidServiceName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return SERVICE_NAME_PATTERN.test(name);
}

/**
 * Resolve the workspace path for a service
 * 
 * @param serviceName Name of the service
 * @param outputDir Optional custom output directory (defaults to current directory)
 * @returns Absolute path to the workspace
 */
export function resolveWorkspacePath(serviceName: string, outputDir?: string): string {
  const { resolve, join } = require('path');
  const baseDir = outputDir ? resolve(outputDir) : process.cwd();
  return join(baseDir, serviceName);
}
