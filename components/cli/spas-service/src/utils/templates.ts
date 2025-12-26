/**
 * Eta template rendering utilities
 */

import { Eta } from 'eta';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getModuleDir } from './paths.js';

/**
 * Get template directory path
 * Templates are located at dist/templates (copied during build)
 */
function getTemplateDir(): string {
  const moduleDir = getModuleDir();
  // moduleDir is dist/ (from dist/index.js), templates are in dist/templates/
  return join(moduleDir, 'templates');
}

/**
 * Initialize Eta with default configuration
 */
let eta: Eta | null = null;

function getEta(): Eta {
  if (!eta) {
    eta = new Eta({
      views: getTemplateDir(),
      cache: false, // Disable caching for development
      autoEscape: false, // Don't escape HTML - we're generating markdown
    });
  }
  return eta;
}

/**
 * Render a template with Eta
 * 
 * Uses Eta's file-based rendering which supports:
 * - Includes: <%~ include('partials/workflow-phases', it) %>
 * - Partials in templates/partials/ directory
 * 
 * @param templateName Name of the template file (without .eta extension)
 * @param data Data to pass to the template
 * @returns Rendered template content
 */
export function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const etaInstance = getEta();
  
  try {
    // Use Eta's render method which supports includes and partials
    const rendered = etaInstance.render(templateName, data);
    
    if (rendered === undefined) {
      throw new Error(`Template "${templateName}" returned undefined`);
    }
    
    return rendered;
  } catch (error) {
    throw new Error(
      `Failed to render template "${templateName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load a partial template content
 * 
 * @param partialName Name of the partial (e.g., "workflow-phases")
 * @returns Partial template content
 */
export function loadPartial(partialName: string): string {
  try {
    const partialPath = join(getTemplateDir(), 'partials', `${partialName}.eta`);
    return readFileSync(partialPath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load partial "${partialName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
