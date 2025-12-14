#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Commands will be registered here by command modules
// import { initCommand } from './commands/init.js';
// import { servicesPullCommand } from './commands/services-pull.js';
// import { choreographyDeployCommand } from './commands/choreography-deploy.js';

// program.addCommand(initCommand);
// program.addCommand(servicesPullCommand);
// program.addCommand(choreographyDeployCommand);

// Global options
program.option('--verbose', 'Enable verbose output', false);
program.option('--json', 'Output results as JSON', false);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
