/**
 * Path utilities for resolving file locations
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Module directory - set at runtime
let _moduleDir: string | null = null;

/**
 * Initialize the module directory from import.meta.url
 * This must be called at startup from the entry point
 */
export function initModuleDir(importMetaUrl: string): void {
  const __filename = fileURLToPath(importMetaUrl);
  _moduleDir = dirname(__filename);
}

/**
 * Set the module directory directly (for testing)
 */
export function setModuleDir(dir: string): void {
  _moduleDir = dir;
}

/**
 * Get the current module directory
 */
export function getModuleDir(): string {
  if (!_moduleDir) {
    throw new Error('Module directory not initialized. Call initModuleDir() first.');
  }
  return _moduleDir;
}

/**
 * Get the path to the design-time-metadata-v1.schema.json file
 * Located at components/schemas/ relative to this CLI package
 */
export function getSchemaSourcePath(): string {
  const moduleDir = getModuleDir();
  
  // From dist/ -> spas-service/ -> cli/ -> components/ -> schemas/
  // Note: moduleDir is set from dist/index.js, so it's the dist/ folder
  return join(
    moduleDir,
    '..',   // dist -> spas-service
    '..',   // spas-service -> cli
    '..',   // cli -> components
    'schemas',
    'design-time-metadata-v1.schema.json'
  );
}
