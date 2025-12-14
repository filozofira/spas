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
 * @returns Resolved CLI configuration
 */
export function resolveConfig(repoFlag?: string): CliConfig {
  const repositoryUrl = 
    repoFlag || 
    process.env.SPAS_REPOSITORY_URL || 
    'http://localhost:3000';

  return {
    repositoryUrl: normalizeUrl(repositoryUrl),
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
