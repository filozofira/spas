#!/usr/bin/env node

/**
 * SPAS Service CLI - Command-line tool for publishing and managing SPAS service metadata
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createPublishCommand } from './commands/publish.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('spas-service')
  .description('CLI tool for publishing and managing SPAS service metadata')
  .version(packageJson.version);

// Register commands
program.addCommand(createPublishCommand());

// Commands to be registered in future phases:
// - pull command (Phase 6)

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
