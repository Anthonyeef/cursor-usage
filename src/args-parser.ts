/**
 * Command-line argument parser
 */

export interface ParsedArgs {
  command: string;
  params: string[];
  flags: Record<string, string | boolean>;
}

/**
 * Parse command-line arguments
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] || 'summary';
  const params: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 1;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      // Long flag: --flag or --flag=value
      const eqIndex = arg.indexOf('=');
      if (eqIndex > -1) {
        const key = arg.substring(2, eqIndex);
        const value = arg.substring(eqIndex + 1);
        flags[key] = value;
      } else {
        const key = arg.substring(2);
        // Check if next arg is value (not a flag)
        if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          flags[key] = argv[i + 1];
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flag: -h
      const key = arg.substring(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        flags[key] = argv[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      // Positional parameter
      params.push(arg);
    }
    i++;
  }

  return { command, params, flags };
}

/**
 * Validate and parse date string (YYYY-MM-DD)
 */
export function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Get date from flag or parameter
 */
export function getDateFlag(
  flags: Record<string, string | boolean>,
  key: string
): Date | null {
  const value = flags[key];
  if (!value || typeof value !== 'string') {
    return null;
  }

  return parseDate(value);
}

/**
 * Get number from flag or parameter
 */
export function getNumberFlag(
  flags: Record<string, string | boolean>,
  key: string,
  defaultValue: number = 0
): number {
  const value = flags[key];
  if (value === undefined || value === true) {
    return defaultValue;
  }

  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get boolean flag
 */
export function getBoolFlag(
  flags: Record<string, string | boolean>,
  key: string
): boolean {
  return flags[key] === true;
}

/**
 * Get string flag
 */
export function getStringFlag(
  flags: Record<string, string | boolean>,
  key: string,
  defaultValue: string = ''
): string {
  const value = flags[key];
  if (typeof value === 'string') {
    return value;
  }
  return defaultValue;
}
