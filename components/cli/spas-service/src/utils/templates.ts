/**
 * Eta template rendering utilities
 */

import { Eta } from 'eta';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Template directory path (relative to utils/)
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');

/**
 * Initialize Eta with default configuration
 */
let eta: Eta | null = null;

function getEta(): Eta {
  if (!eta) {
    eta = new Eta({
      views: TEMPLATE_DIR,
      cache: false, // Disable caching for development
      autoEscape: false, // Don't escape HTML - we're generating markdown
    });
  }
  return eta;
}

/**
 * Render a template with Eta
 * 
 * @param templateName Name of the template file (without .eta extension)
 * @param data Data to pass to the template
 * @returns Rendered template content
 */
export function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const etaInstance = getEta();
  
  try {
    // Read the template file
    const templatePath = join(TEMPLATE_DIR, `${templateName}.eta`);
    const templateContent = readFileSync(templatePath, 'utf-8');
    
    // Render the template
    const rendered = etaInstance.renderString(templateContent, data);
    
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
    const partialPath = join(TEMPLATE_DIR, 'partials', `${partialName}.eta`);
    return readFileSync(partialPath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load partial "${partialName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
