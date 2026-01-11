/**
 * Simple table formatting utilities
 */

export interface TableOptions {
  headers: string[];
  rows: string[][];
  maxWidth?: number;
}

/**
 * Format data as a simple ASCII table
 */
export function formatTable(options: TableOptions): string {
  const { headers, rows } = options;

  if (rows.length === 0) {
    return 'No data to display';
  }

  // Calculate column widths
  const colWidths: number[] = headers.map((h, i) => {
    const headerWidth = h.length;
    const maxRowWidth = Math.max(
      ...rows.map((row) => (row[i] ? row[i].length : 0))
    );
    return Math.max(headerWidth, maxRowWidth);
  });

  // Build separator line
  const separator = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';

  // Build header line
  const headerLine =
    '| ' +
    headers
      .map((h, i) => h.padEnd(colWidths[i]))
      .join(' | ') +
    ' |';

  // Build data lines
  const dataLines = rows.map(
    (row) =>
      '| ' +
      row
        .map((cell, i) => (cell || '').padEnd(colWidths[i]))
        .join(' | ') +
      ' |'
  );

  // Combine all parts
  return [separator, headerLine, separator, ...dataLines, separator].join(
    '\n'
  );
}

/**
 * Create a simple data table with borders
 */
export function createTable(
  headers: string[],
  rows: string[][]
): string {
  return formatTable({ headers, rows });
}
