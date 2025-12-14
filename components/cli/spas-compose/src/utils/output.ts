/**
 * Terminal output utilities using chalk for formatting
 */

import chalk from 'chalk';

/**
 * Success message (green checkmark)
 */
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Error message (red X)
 */
export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Info message (blue info icon)
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Warning message (yellow warning icon)
 */
export function warning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Verbose message (dimmed text, only shown with --verbose)
 */
export function verbose(message: string, isVerbose: boolean = false): void {
  if (isVerbose) {
    console.log(chalk.dim('  →'), chalk.dim(message));
  }
}

/**
 * Section header (bold, underlined)
 */
export function header(message: string): void {
  console.log();
  console.log(chalk.bold.underline(message));
  console.log();
}

/**
 * JSON output (for machine consumption)
 */
export function json(data: Record<string, any>): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * List item (bullet point)
 */
export function listItem(message: string, indent: number = 0): void {
  const indentation = '  '.repeat(indent);
  console.log(`${indentation}${chalk.dim('•')} ${message}`);
}

/**
 * Progress indicator (for long-running operations)
 */
export function progress(message: string): void {
  process.stdout.write(chalk.cyan('⋯') + ' ' + message + '...\r');
}

/**
 * Clear progress indicator
 */
export function clearProgress(): void {
  process.stdout.write('\r\x1b[K'); // Clear line
}

/**
 * Format command for display (monospace)
 */
export function command(cmd: string): string {
  return chalk.cyan(`\`${cmd}\``);
}

/**
 * Format file path for display
 */
export function filepath(path: string): string {
  return chalk.yellow(path);
}

/**
 * Format service name for display
 */
export function serviceName(name: string): string {
  return chalk.magenta(name);
}

/**
 * Format version for display
 */
export function version(ver: string): string {
  return chalk.cyan(ver);
}
