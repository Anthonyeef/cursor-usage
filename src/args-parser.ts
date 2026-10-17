/**
 * Command-line argument parser
 */

export interface ParsedArgs {
  command: string;
  params: string[];
  flags: Record<string, string | boolean>;
}

/**
 * Parse command-line arguments.
 * Leading flags (e.g. `--token … --json`) are allowed before the command.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const params: string[] = [];
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex > -1) {
        const key = arg.substring(2, eqIndex);
        const value = arg.substring(eqIndex + 1);
        flags[key] = value;
      } else {
        const key = arg.substring(2);
        // Flags that always take a value when the next arg is present
        const valueFlags = new Set([
          'token',
          'since',
          'until',
          'days',
        ]);
        if (
          i + 1 < argv.length &&
          !argv[i + 1].startsWith('-') &&
          (valueFlags.has(key) || !isKnownBooleanFlag(key))
        ) {
          // For known boolean flags, don't consume next token
          if (isKnownBooleanFlag(key)) {
            flags[key] = true;
          } else {
            flags[key] = argv[i + 1];
            i++;
          }
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.substring(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-') && key !== 'h') {
        flags[key] = argv[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
    i++;
  }

  const command = positionals[0] || 'summary';
  for (let p = 1; p < positionals.length; p++) {
    params.push(positionals[p]);
  }

  return { command, params, flags };
}

function isKnownBooleanFlag(key: string): boolean {
  return (
    key === 'json' ||
    key === 'breakdown' ||
    key === 'compact' ||
    key === 'help'
  );
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
