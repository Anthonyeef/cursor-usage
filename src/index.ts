#!/usr/bin/env tsx

/**
 * Cursor Usage Analyzer
 * A CLI tool for analyzing Cursor API usage and token consumption
 */

import { runCLI } from './cli';

const argv = process.argv.slice(2);

runCLI(argv).catch((error) => {
  console.error(`Fatal error: ${String(error)}`);
  process.exit(1);
});
