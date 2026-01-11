/**
 * CLI command handlers
 */

import type { CursorCredentials } from './_types.js';
import {
  fetchUsageEvents,
  groupByDay,
  calculateDailyStats,
  groupByMonth,
  calculateMonthlyStats,
  formatMonthlyStatsTable,
  groupByWeek,
  calculateWeeklyStats,
  formatWeeklyStatsTable,
  calculateModelBreakdown,
  formatModelBreakdownTable,
} from './event-loader.js';
import {
  createTable,
  createTitleBox,
  formatNumber,
  formatCurrency,
  formatTotalsRow,
  colors,
} from './table-formatter.js';
import { logger } from './logger.js';

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

  const data: any = {
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

  logger.log(createTitleBox(title));

  const tableData = formatModelBreakdownTable(breakdown, totalTokens, totalCost);
  const table = createTable(
    ['Model', 'Events', 'Total Tokens', 'Cost', 'Token %', 'Cost %'],
    tableData,
    ['left', 'right', 'right', 'right', 'right', 'right']
  );

  logger.log(table + '\n');
}

/**
 * Show daily usage report for a date range
 */
export async function showDailyReport(
  credentials: CursorCredentials,
  days: number = 7,
  options: { breakdown?: boolean; startDate?: Date; endDate?: Date; compact?: boolean } = {},
  outputJson: boolean = false
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

  // Group and calculate stats
  const grouped = groupByDay(events);
  const stats = calculateDailyStats(grouped);

  if (outputJson) {
    // Output JSON only - no table display
    const jsonOutput = statsToJSON('daily', stats, events, { breakdown: options.breakdown, period: `last ${days} days` });
    console.log(jsonOutput);
  } else {
    // Display title box
    logger.log(createTitleBox(`Cursor Usage Report - Daily (Last ${days} days)`));

    const tableData = stats.map((day) => {
      const modelList = Array.from(day.models.entries())
        .map(([model, count]) => `${model}(${count})`)
        .join(', ');

      return [
        day.date,
        day.eventCount.toString(),
        formatNumber(day.totalTokens),
        formatNumber(day.inputTokens),
        formatNumber(day.outputTokens),
        formatCurrency(day.totalCost),
        modelList || 'N/A',
      ];
    });

    // Calculate totals
    const totalEvents = stats.reduce((sum, day) => sum + day.eventCount, 0);
    const totalTokens = stats.reduce((sum, day) => sum + day.totalTokens, 0);
    const totalInputTokens = stats.reduce((sum, day) => sum + day.inputTokens, 0);
    const totalOutputTokens = stats.reduce((sum, day) => sum + day.outputTokens, 0);
    const totalCost = stats.reduce((sum, day) => sum + day.totalCost, 0);

    // Add totals row
    tableData.push(formatTotalsRow([
      'Total',
      totalEvents.toString(),
      formatNumber(totalTokens),
      formatNumber(totalInputTokens),
      formatNumber(totalOutputTokens),
      formatCurrency(totalCost),
      '',
    ]));

    const table = createTable(
      ['Date', 'Events', 'Total Tokens', 'Input', 'Output', 'Cost', 'Models'],
      tableData,
      ['left', 'right', 'right', 'right', 'right', 'right', 'left']
    );

    logger.log(table + '\n');

    // Show breakdown if requested
    if (options.breakdown) {
      displayBreakdown(events, 'PER-MODEL BREAKDOWN');
    }
  }
}

/**
 * Show monthly usage report
 */
export async function showMonthlyReport(
  credentials: CursorCredentials,
  months: number = 3,
  options: { breakdown?: boolean; startDate?: Date; endDate?: Date; compact?: boolean } = {},
  outputJson: boolean = false
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

  // Group and calculate stats
  const grouped = groupByMonth(events);
  const stats = calculateMonthlyStats(grouped);

  if (outputJson) {
    // Output JSON only - no table display
    const jsonOutput = statsToJSON('monthly', stats, events, { breakdown: options.breakdown, period: `last ${months} months` });
    console.log(jsonOutput);
  } else {
    // Display title box
    logger.log(createTitleBox(`Cursor Usage Report - Monthly (Last ${months} months)`));

    const tableData = formatMonthlyStatsTable(stats);

    // Calculate totals
    const totalEvents = stats.reduce((sum, month) => sum + month.eventCount, 0);
    const totalTokens = stats.reduce((sum, month) => sum + month.totalTokens, 0);
    const totalInputTokens = stats.reduce((sum, month) => sum + month.inputTokens, 0);
    const totalOutputTokens = stats.reduce((sum, month) => sum + month.outputTokens, 0);
    const totalCost = stats.reduce((sum, month) => sum + month.totalCost, 0);

    // Add totals row
    tableData.push(formatTotalsRow([
      'Total',
      totalEvents.toString(),
      formatNumber(totalTokens),
      formatNumber(totalInputTokens),
      formatNumber(totalOutputTokens),
      formatCurrency(totalCost),
      '',
    ]));

    const table = createTable(
      ['Month', 'Events', 'Total Tokens', 'Input', 'Output', 'Cost', 'Models'],
      tableData,
      ['left', 'right', 'right', 'right', 'right', 'right', 'left']
    );

    logger.log(table + '\n');

    // Show breakdown if requested
    if (options.breakdown) {
      displayBreakdown(events, 'PER-MODEL BREAKDOWN');
    }
  }
}

/**
 * Show weekly usage report
 */
export async function showWeeklyReport(
  credentials: CursorCredentials,
  weeks: number = 4,
  options: { breakdown?: boolean; startDate?: Date; endDate?: Date; compact?: boolean } = {},
  outputJson: boolean = false
) {
  let startDate = options.startDate;
  let endDate = options.endDate;

  if (!startDate || !endDate) {
    endDate = endDate || new Date();
    startDate = startDate || new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Set to start of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const events = await fetchUsageEvents(credentials, startDate, endDate);

  if (events.length === 0) {
    logger.warn('No usage events found for this period');
    return;
  }

  // Group and calculate stats
  const grouped = groupByWeek(events);
  const stats = calculateWeeklyStats(grouped);

  if (outputJson) {
    // Output JSON only - no table display
    const jsonOutput = statsToJSON('weekly', stats, events, { breakdown: options.breakdown, period: `last ${weeks} weeks` });
    console.log(jsonOutput);
  } else {
    // Display title box
    logger.log(createTitleBox(`Cursor Usage Report - Weekly (Last ${weeks} weeks)`));

    const tableData = formatWeeklyStatsTable(stats);

    // Calculate totals
    const totalEvents = stats.reduce((sum, week) => sum + week.eventCount, 0);
    const totalTokens = stats.reduce((sum, week) => sum + week.totalTokens, 0);
    const totalInputTokens = stats.reduce((sum, week) => sum + week.inputTokens, 0);
    const totalOutputTokens = stats.reduce((sum, week) => sum + week.outputTokens, 0);
    const totalCost = stats.reduce((sum, week) => sum + week.totalCost, 0);

    // Add totals row
    tableData.push(formatTotalsRow([
      'Total',
      totalEvents.toString(),
      formatNumber(totalTokens),
      formatNumber(totalInputTokens),
      formatNumber(totalOutputTokens),
      formatCurrency(totalCost),
      '',
    ]));

    const table = createTable(
      ['Week', 'Events', 'Total Tokens', 'Input', 'Output', 'Cost', 'Models'],
      tableData,
      ['left', 'right', 'right', 'right', 'right', 'right', 'left']
    );

    logger.log(table + '\n');

    // Show breakdown if requested
    if (options.breakdown) {
      displayBreakdown(events, 'PER-MODEL BREAKDOWN');
    }
  }
}

/**
 * Show usage for a specific date
 */
export async function showDateReport(
  credentials: CursorCredentials,
  date: Date,
  options: { breakdown?: boolean; compact?: boolean } = {},
  outputJson: boolean = false
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

  if (outputJson) {
    // Output JSON only - no table display
    const jsonOutput = statsToJSON('today', events.map((e, i) => ({ ...e, eventIndex: i })), events, { breakdown: options.breakdown, period: 'today' });
    console.log(jsonOutput);
  } else {
    // Display title box
    logger.log(createTitleBox(`Cursor Usage Report - ${date.toDateString()}`));

    const tableData = events.map((event) => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      return [
        timestamp,
        event.model,
        event.type,
        formatNumber(event.inputTokens),
        formatNumber(event.outputTokens),
        formatNumber(event.tokens),
        formatCurrency(event.cost || 0),
      ];
    });

    // Calculate totals
    const totalInputTokens = events.reduce((sum, e) => sum + e.inputTokens, 0);
    const totalOutputTokens = events.reduce((sum, e) => sum + e.outputTokens, 0);
    const totalTokens = events.reduce((sum, e) => sum + e.tokens, 0);
    const totalCost = events.reduce((sum, e) => sum + (e.cost || 0), 0);

    // Add totals row
    tableData.push(formatTotalsRow([
      'Total',
      '',
      '',
      formatNumber(totalInputTokens),
      formatNumber(totalOutputTokens),
      formatNumber(totalTokens),
      formatCurrency(totalCost),
    ]));

    const table = createTable(
      ['Time', 'Model', 'Type', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost'],
      tableData,
      ['left', 'left', 'left', 'right', 'right', 'right', 'right']
    );

    logger.log(table + '\n');

    // Show breakdown if requested
    if (options.breakdown) {
      displayBreakdown(events, 'PER-MODEL BREAKDOWN');
    }
  }
}
