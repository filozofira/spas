/**
 * Output formatting utilities with color support
 */

import chalk from 'chalk';
import type { CliError } from '../types.js';

/**
 * Print a success message with checkmark
 */
export function success(message: string): void {
  console.log(chalk.green('✓') + ' ' + message);
}

/**
 * Print an error message with X mark
 */
export function error(message: string, hint?: string): void {
  console.error(chalk.red('✗') + ' ' + message);
  if (hint) {
    console.error(chalk.yellow('  Hint: ') + hint);
  }
}

/**
 * Print a CLI error with formatted output
 */
export function printError(err: CliError): void {
  error(err.message, err.hint);
  
  if (err.details && process.env.DEBUG) {
    console.error(chalk.gray('\nDetails:'));
    console.error(chalk.gray(JSON.stringify(err.details, null, 2)));
  }
}

/**
 * Print an info message
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ') + ' ' + message);
}

/**
 * Print a warning message
 */
export function warn(message: string): void {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

/**
 * Print verbose output (only if DEBUG env var is set)
 */
export function verbose(message: string): void {
  if (process.env.DEBUG) {
    console.log(chalk.gray('[DEBUG] ') + message);
  }
}

/**
 * Print verbose output when verbose flag is enabled
 */
export function verboseLog(message: string, isVerbose: boolean): void {
  if (isVerbose) {
    console.log(chalk.gray('[VERBOSE] ') + message);
  }
}

/**
 * Print a list item
 */
export function listItem(message: string): void {
  console.log('  ' + chalk.gray('•') + ' ' + message);
}

/**
 * Print JSON output to stdout
 */
export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Print a section header
 */
export function header(message: string): void {
  console.log('\n' + chalk.bold(message));
}

/**
 * Print archive contents summary
 */
export function printArchiveContents(
  identity: { id: string; name: string; version: string },
  schemas: string[]
): void {
  header('Archive contents:');
  console.log(`  - spas.json (${identity.id} v${identity.version})`);
  schemas.forEach(schema => {
    console.log(`  - ${schema}`);
  });
}
