/**
 * CLI command handlers
 */

import type { CursorCredentials } from './_types';
import {
  fetchUsageEvents,
  groupByDay,
  calculateDailyStats,
  groupByMonth,
  calculateMonthlyStats,
  formatMonthlyStatsTable,
  calculateModelBreakdown,
  formatModelBreakdownTable,
} from './event-loader';
import { createTable } from './table-formatter';
import { logger } from './logger';

/**
 * Convert stats to JSON
 */
export function statsToJSON(
  command: string,
  stats: any[],
  events: any[],
  options: any = {}
): string {
  const totalTokens = events.reduce((sum, e) => sum + e.tokens, 0);
  const totalCost = events.reduce((sum, e) => sum + (e.cost || 0), 0);
  const totalEvents = events.length;

  const data = {
    command,
    generatedAt: new Date().toISOString(),
    period: options.period || command,
    timeRange: options.timeRange,
    summary: {
      totalEvents,
      totalTokens,
      totalCost: parseFloat(totalCost.toFixed(2)),
    },
    data: stats,
  };

  if (options.breakdown) {
    const breakdown = calculateModelBreakdown(events);
    data.breakdown = Array.from(breakdown.values()).map((model) => ({
      model: model.model,
      count: model.count,
      totalTokens: model.totalTokens,
      inputTokens: model.inputTokens,
      outputTokens: model.outputTokens,
      totalCost: parseFloat(model.totalCost.toFixed(2)),
      tokenPercent: parseFloat(((model.totalTokens / totalTokens) * 100).toFixed(2)),
      costPercent: parseFloat(((model.totalCost / totalCost) * 100).toFixed(2)),
    }));
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Display model breakdown
 */
function displayBreakdown(events: any[], title: string = 'MODEL BREAKDOWN') {
  const breakdown = calculateModelBreakdown(events);
  const totalTokens = events.reduce((sum, e) => sum + e.tokens, 0);
  const totalCost = events.reduce((sum, e) => sum + (e.cost || 0), 0);

  logger.log('\n' + '='.repeat(100));
  logger.log(title);
  logger.log('='.repeat(100) + '\n');

  const tableData = formatModelBreakdownTable(breakdown, totalTokens, totalCost);
  const table = createTable(
    ['Model', 'Events', 'Total Tokens', 'Cost', 'Token %', 'Cost %'],
    tableData
  );

  logger.log(table + '\n');
}

/**
 * Show daily usage report for a date range
 */
export async function showDailyReport(
  credentials: CursorCredentials,
  days: number = 7,
  options: { breakdown?: boolean; startDate?: Date; endDate?: Date } = {}
) {
  let startDate = options.startDate;
  let endDate = options.endDate;

  if (!startDate || !endDate) {
    endDate = endDate || new Date();
    startDate = startDate || new Date();
    startDate.setDate(startDate.getDate() - days);

    // Set to start of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const events = await fetchUsageEvents(credentials, startDate, endDate);

  if (events.length === 0) {
    logger.warn('No usage events found for this period');
    return;
  }

  logger.log('');

  // Group and calculate stats
  const grouped = groupByDay(events);
  const stats = calculateDailyStats(grouped);

  // Display table
  logger.log('\n' + '='.repeat(100));
  logger.log(`DAILY USAGE REPORT (Last ${days} days)`);
  logger.log('='.repeat(100) + '\n');

  const tableData = stats.map((day) => {
    const modelList = Array.from(day.models.entries())
      .map(([model, count]) => `${model}(${count})`)
      .join(', ');

    return [
      day.date,
      day.eventCount.toString(),
      day.totalTokens.toLocaleString(),
      day.inputTokens.toLocaleString(),
      day.outputTokens.toLocaleString(),
      `$${day.totalCost.toFixed(2)}`,
      modelList || 'N/A',
    ];
  });

  const table = createTable(
    ['Date', 'Events', 'Total Tokens', 'Input', 'Output', 'Cost', 'Models'],
    tableData
  );

  logger.log(table);

  // Summary
  const totalEvents = stats.reduce((sum, day) => sum + day.eventCount, 0);
  const totalTokens = stats.reduce((sum, day) => sum + day.totalTokens, 0);
  const totalCost = stats.reduce((sum, day) => sum + day.totalCost, 0);

  logger.log('\n' + '='.repeat(100));
  logger.log('SUMMARY');
  logger.log('='.repeat(100));
  logger.log(`Total Events: ${totalEvents}`);
  logger.log(`Total Tokens: ${totalTokens.toLocaleString()}`);
  logger.log(`Total Cost: $${totalCost.toFixed(2)}`);
  logger.log('='.repeat(100) + '\n');

  // Show breakdown if requested
  if (options.breakdown) {
    displayBreakdown(events, 'PER-MODEL BREAKDOWN');
  }
}

/**
 * Show monthly usage report
 */
export async function showMonthlyReport(
  credentials: CursorCredentials,
  months: number = 3,
  options: { breakdown?: boolean; startDate?: Date; endDate?: Date } = {}
) {
  let startDate = options.startDate;
  let endDate = options.endDate;

  if (!startDate || !endDate) {
    endDate = endDate || new Date();
    startDate = startDate || new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Set to start of month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const events = await fetchUsageEvents(credentials, startDate, endDate);

  if (events.length === 0) {
    logger.warn('No usage events found for this period');
    return;
  }

  logger.log('');

  // Group and calculate stats
  const grouped = groupByMonth(events);
  const stats = calculateMonthlyStats(grouped);

  // Display table
  logger.log('\n' + '='.repeat(100));
  logger.log(`MONTHLY USAGE REPORT (Last ${months} months)`);
  logger.log('='.repeat(100) + '\n');

  const tableData = formatMonthlyStatsTable(stats);

  const table = createTable(
    ['Month', 'Events', 'Total Tokens', 'Input', 'Output', 'Cost', 'Models'],
    tableData
  );

  logger.log(table);

  // Summary
  const totalEvents = stats.reduce((sum, month) => sum + month.eventCount, 0);
  const totalTokens = stats.reduce((sum, month) => sum + month.totalTokens, 0);
  const totalCost = stats.reduce((sum, month) => sum + month.totalCost, 0);

  logger.log('\n' + '='.repeat(100));
  logger.log('SUMMARY');
  logger.log('='.repeat(100));
  logger.log(`Total Events: ${totalEvents}`);
  logger.log(`Total Tokens: ${totalTokens.toLocaleString()}`);
  logger.log(`Total Cost: $${totalCost.toFixed(2)}`);
  logger.log(`Average per month: ${(totalTokens / Math.max(1, stats.length)).toLocaleString()} tokens, $${(totalCost / Math.max(1, stats.length)).toFixed(2)}`);
  logger.log('='.repeat(100) + '\n');

  // Show breakdown if requested
  if (options.breakdown) {
    displayBreakdown(events, 'PER-MODEL BREAKDOWN');
  }
}

/**
 * Show usage for a specific date
 */
export async function showDateReport(
  credentials: CursorCredentials,
  date: Date
) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const events = await fetchUsageEvents(credentials, startDate, endDate);

  if (events.length === 0) {
    logger.warn('No usage events found for this date');
    return;
  }

  logger.log('');

  // Display detailed events
  logger.log('\n' + '='.repeat(120));
  logger.log(`USAGE EVENTS FOR ${date.toDateString()}`);
  logger.log('='.repeat(120) + '\n');

  const tableData = events.map((event) => {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    return [
      timestamp,
      event.model,
      event.type,
      event.inputTokens.toLocaleString(),
      event.outputTokens.toLocaleString(),
      event.tokens.toLocaleString(),
      `$${event.cost?.toFixed(4) || '0.0000'}`,
    ];
  });

  const table = createTable(
    ['Time', 'Model', 'Type', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost'],
    tableData
  );

  logger.log(table);

  // Summary
  const totalTokens = events.reduce((sum, e) => sum + e.tokens, 0);
  const totalCost = events.reduce((sum, e) => sum + (e.cost || 0), 0);

  logger.log('\n' + '='.repeat(120));
  logger.log(`Total Events: ${events.length}`);
  logger.log(`Total Tokens: ${totalTokens.toLocaleString()}`);
  logger.log(`Total Cost: $${totalCost.toFixed(2)}`);
  logger.log('='.repeat(120) + '\n');
}
