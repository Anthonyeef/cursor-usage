/**
 * Event loading utilities for detailed usage analysis
 * Fetches granular usage events for building daily/weekly reports
 */

import type { CursorCredentials } from './_types';
import {
  CURSOR_API_URL_EVENTS,
  DEFAULT_TIMEOUT,
  USER_AGENT,
} from './_consts';
import { logger } from './logger';

export interface UsageEvent {
  id: string;
  timestamp: number;
  model: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  type: string;
  kind: string;
  cost: number;
  maxMode: boolean;
}

export interface EventsResponse {
  events: UsageEvent[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch usage events for a date range
 */
export async function fetchUsageEvents(
  credentials: CursorCredentials,
  startDate: Date,
  endDate: Date,
  pageSize: number = 100
): Promise<UsageEvent[]> {
  try {
    const sessionToken = `${credentials.userId}::${credentials.accessToken}`;

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      Origin: 'https://cursor.com',
    };

    const cookieHeader = `WorkosCursorSessionToken=${encodeURIComponent(
      sessionToken
    )}`;

    // Convert dates to millisecond timestamps
    const startTimestamp = startDate.getTime().toString();
    const endTimestamp = endDate.getTime().toString();

    const body = {
      teamId: 0,
      startDate: startTimestamp,
      endDate: endTimestamp,
      page: 1,
      pageSize,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(CURSOR_API_URL_EVENTS, {
      method: 'POST',
      headers: {
        ...headers,
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error(
        `Events API request failed with status ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const data = (await response.json()) as any;
    return parseEvents(data);
  } catch (error) {
    logger.error(`Error fetching usage events: ${String(error)}`);
    return [];
  }
}

/**
 * Parse and validate events response
 */
function parseEvents(data: any): UsageEvent[] {
  try {
    if (!Array.isArray(data?.usageEventsDisplay)) {
      return [];
    }

    return data.usageEventsDisplay.map((event: any) => {
      const tokenUsage = event.tokenUsage || {};
      const totalTokens =
        (tokenUsage.inputTokens || 0) +
        (tokenUsage.outputTokens || 0) +
        (tokenUsage.cacheWriteTokens || 0) +
        (tokenUsage.cacheReadTokens || 0);

      return {
        id: event.id || `${event.timestamp}-${event.model}`,
        timestamp: Number(event.timestamp) || Date.now(),
        model: event.model || 'unknown',
        tokens: totalTokens,
        inputTokens: Number(tokenUsage.inputTokens) || 0,
        outputTokens: Number(tokenUsage.outputTokens) || 0,
        cacheWriteTokens: Number(tokenUsage.cacheWriteTokens) || 0,
        cacheReadTokens: Number(tokenUsage.cacheReadTokens) || 0,
        type: 'usage',
        kind: event.kind || 'unknown',
        cost: Number(tokenUsage.totalCents) / 100 || 0, // Convert cents to dollars
        maxMode: event.maxMode || false,
      };
    });
  } catch (error) {
    logger.error(`Error parsing events: ${String(error)}`);
    return [];
  }
}

/**
 * Group events by day
 */
export function groupByDay(
  events: UsageEvent[]
): Map<string, UsageEvent[]> {
  const grouped = new Map<string, UsageEvent[]>();

  events.forEach((event) => {
    const date = new Date(event.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });

  return grouped;
}

/**
 * Calculate daily statistics
 */
export interface DailyStats {
  date: string;
  eventCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  models: Map<string, number>;
}

export function calculateDailyStats(
  groupedEvents: Map<string, UsageEvent[]>
): DailyStats[] {
  const stats: DailyStats[] = [];

  Array.from(groupedEvents.entries())
    .sort()
    .forEach(([date, events]) => {
      const models = new Map<string, number>();

      let totalTokens = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      let totalCost = 0;

      events.forEach((event) => {
        totalTokens += event.tokens;
        inputTokens += event.inputTokens;
        outputTokens += event.outputTokens;
        totalCost += event.cost || 0;

        const count = models.get(event.model) || 0;
        models.set(event.model, count + 1);
      });

      stats.push({
        date,
        eventCount: events.length,
        totalTokens,
        inputTokens,
        outputTokens,
        totalCost,
        models,
      });
    });

  return stats;
}

/**
 * Format daily stats for table display
 */
export function formatDailyStatsTable(stats: DailyStats[]): string[][] {
  return stats.map((day) => {
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
}

/**
 * Group events by month
 */
export function groupByMonth(
  events: UsageEvent[]
): Map<string, UsageEvent[]> {
  const grouped = new Map<string, UsageEvent[]>();

  events.forEach((event) => {
    const date = new Date(event.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(event);
  });

  return grouped;
}

/**
 * Calculate monthly statistics
 */
export function calculateMonthlyStats(
  groupedEvents: Map<string, UsageEvent[]>
): any[] {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const stats: any[] = [];

  Array.from(groupedEvents.entries())
    .sort()
    .forEach(([monthKey, events]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);

      const models = new Map<string, number>();

      let totalTokens = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      let totalCost = 0;

      events.forEach((event) => {
        totalTokens += event.tokens;
        inputTokens += event.inputTokens;
        outputTokens += event.outputTokens;
        totalCost += event.cost || 0;

        const count = models.get(event.model) || 0;
        models.set(event.model, count + 1);
      });

      stats.push({
        year,
        month,
        monthName: monthNames[month - 1],
        monthKey,
        eventCount: events.length,
        totalTokens,
        inputTokens,
        outputTokens,
        totalCost,
        models,
      });
    });

  return stats;
}

/**
 * Format monthly stats for table display
 */
export function formatMonthlyStatsTable(stats: any[]): string[][] {
  return stats.map((month) => {
    const modelList = Array.from(month.models.entries())
      .map(([model, count]: [string, number]) => `${model}(${count})`)
      .join(', ');

    return [
      `${month.monthName} ${month.year}`,
      month.eventCount.toString(),
      month.totalTokens.toLocaleString(),
      month.inputTokens.toLocaleString(),
      month.outputTokens.toLocaleString(),
      `$${month.totalCost.toFixed(2)}`,
      modelList || 'N/A',
    ];
  });
}

/**
 * Calculate per-model breakdown
 */
export function calculateModelBreakdown(events: UsageEvent[]): Map<string, any> {
  const breakdown = new Map<string, any>();

  events.forEach((event) => {
    const model = event.model || 'unknown';
    if (!breakdown.has(model)) {
      breakdown.set(model, {
        model,
        count: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
      });
    }

    const stats = breakdown.get(model)!;
    stats.count += 1;
    stats.totalTokens += event.tokens;
    stats.inputTokens += event.inputTokens;
    stats.outputTokens += event.outputTokens;
    stats.totalCost += event.cost || 0;
  });

  return breakdown;
}

/**
 * Format model breakdown for display
 */
export function formatModelBreakdownTable(
  breakdown: Map<string, any>,
  totalTokens: number,
  totalCost: number
): string[][] {
  const sorted = Array.from(breakdown.values()).sort(
    (a, b) => b.totalTokens - a.totalTokens
  );

  return sorted.map((model) => {
    const tokenPercent = totalTokens > 0 ? (model.totalTokens / totalTokens * 100).toFixed(1) : '0.0';
    const costPercent = totalCost > 0 ? (model.totalCost / totalCost * 100).toFixed(1) : '0.0';

    return [
      model.model,
      model.count.toString(),
      model.totalTokens.toLocaleString(),
      `$${model.totalCost.toFixed(2)}`,
      `${tokenPercent}%`,
      `${costPercent}%`,
    ];
  });
}
