#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInitCommand } from './commands/init.js';
import { createServicesPullCommand } from './commands/services-pull.js';
import { createChoreographyCommand } from './commands/choreography-deploy.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('spas-compose')
  .description('SPAS Compose CLI - Domain choreography composition tool')
  .version(packageJson.version);

// Register commands
program.addCommand(createInitCommand());
program.addCommand(createServicesPullCommand());
program.addCommand(createChoreographyCommand());

// Global options
program.option('--verbose', 'Enable verbose output', false);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
