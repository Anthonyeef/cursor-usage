/**
 * Table formatting utilities with polished Unicode styling
 * Inspired by ccusage (https://github.com/ryoppippi/ccusage)
 */

import Table from 'cli-table3';
import pc from 'picocolors';

export type TableCellAlign = 'left' | 'right' | 'center';

export interface TableOptions {
  headers: string[];
  rows: (string | number)[][];
  colAligns?: TableCellAlign[];
  headerStyle?: 'cyan' | 'yellow' | 'green' | 'magenta' | 'white';
}

/**
 * Format data as a styled Unicode table
 */
export function formatTable(options: TableOptions): string {
  const { headers, rows, colAligns, headerStyle = 'cyan' } = options;

  if (rows.length === 0) {
    return 'No data to display';
  }

  // Create table with styled headers
  const table = new Table({
    head: headers,
    style: { head: [headerStyle] },
    colAligns: colAligns || headers.map(() => 'left'),
    wordWrap: true,
  });

  // Add rows
  for (const row of rows) {
    table.push(row.map((cell) => String(cell)));
  }

  return table.toString();
}

/**
 * Create a simple data table with Unicode borders
 */
export function createTable(
  headers: string[],
  rows: (string | number)[][],
  colAligns?: TableCellAlign[]
): string {
  return formatTable({ headers, rows, colAligns });
}

/**
 * Format a number with locale-specific thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Create a styled title box for report headers
 */
export function createTitleBox(title: string): string {
  const innerWidth = Math.max(title.length + 4, 40);
  const padding = Math.floor((innerWidth - title.length) / 2);
  const extraPadding = (innerWidth - title.length) % 2;
  
  const top = '╭' + '─'.repeat(innerWidth) + '╮';
  const middle = '│' + ' '.repeat(padding) + title + ' '.repeat(padding + extraPadding) + '│';
  const bottom = '╰' + '─'.repeat(innerWidth) + '╯';
  
  return '\n' + top + '\n' + middle + '\n' + bottom + '\n';
}

/**
 * Style text with color
 */
export const colors = {
  cyan: (text: string) => pc.cyan(text),
  yellow: (text: string) => pc.yellow(text),
  green: (text: string) => pc.green(text),
  red: (text: string) => pc.red(text),
  gray: (text: string) => pc.gray(text),
  bold: (text: string) => pc.bold(text),
  dim: (text: string) => pc.dim(text),
};

/**
 * Format a row with yellow highlighting (for totals)
 */
export function formatTotalsRow(cells: (string | number)[]): string[] {
  return cells.map((cell) => pc.yellow(String(cell)));
}

/**
 * Create a usage report table with consistent styling
 */
export interface UsageReportOptions {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  totals?: (string | number)[];
  colAligns?: TableCellAlign[];
}

export function createUsageReportTable(options: UsageReportOptions): string {
  const { title, headers, rows, totals, colAligns } = options;
  
  const output: string[] = [];
  
  // Title box
  output.push(createTitleBox(title));
  
  // Create table
  const table = new Table({
    head: headers,
    style: { head: ['cyan'] },
    colAligns: colAligns || headers.map((_, i) => (i === 0 ? 'left' : 'right')),
    wordWrap: true,
  });
  
  // Add data rows
  for (const row of rows) {
    table.push(row.map((cell) => String(cell)));
  }
  
  // Add totals row with yellow highlighting
  if (totals) {
    const formattedTotals = totals.map((cell, i) => 
      i === 0 ? pc.yellow(String(cell)) : pc.yellow(String(cell))
    );
    table.push(formattedTotals);
  }
  
  output.push(table.toString());
  
  return output.join('\n');
}

/**
 * Create a summary section with styled output
 */
export function createSummary(items: { label: string; value: string | number }[]): string {
  const maxLabelWidth = Math.max(...items.map((item) => item.label.length));
  
  const lines = items.map((item) => {
    const label = pc.cyan(item.label.padEnd(maxLabelWidth));
    const value = pc.yellow(String(item.value));
    return `  ${label}  ${value}`;
  });
  
  return lines.join('\n');
}

/**
 * Shorten model names for display
 * e.g., "claude-sonnet-4-20250514" -> "sonnet-4"
 */
export function formatModelName(modelName: string): string {
  // Match claude-{type}-{version}-{date} pattern
  const match = modelName.match(/^claude-(\w+)-([\d-]+)-(\d{8})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  // Match claude-{type}-{version} without date
  const noDateMatch = modelName.match(/^claude-(\w+)-([\d-]+)$/);
  if (noDateMatch) {
    return `${noDateMatch[1]}-${noDateMatch[2]}`;
  }
  
  return modelName;
}

/**
 * Format an array of model names for display
 */
export function formatModelsDisplay(models: string[]): string {
  const uniqueModels = [...new Set(models.map(formatModelName))];
  return uniqueModels.sort().join(', ');
}
