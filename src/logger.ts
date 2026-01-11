/**
 * Simple logging utilities
 */

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export const logger = {
  log: (message: string) => {
    console.log(message);
  },

  info: (message: string) => {
    console.log(`${COLORS.cyan}ℹ ${COLORS.reset}${message}`);
  },

  success: (message: string) => {
    console.log(`${COLORS.green}✓ ${COLORS.reset}${message}`);
  },

  warn: (message: string) => {
    console.warn(`${COLORS.yellow}⚠ ${COLORS.reset}${message}`);
  },

  error: (message: string) => {
    console.error(`${COLORS.red}✗ ${COLORS.reset}${message}`);
  },

  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(`${COLORS.dim}[DEBUG] ${message}${COLORS.reset}`);
    }
  },
};
