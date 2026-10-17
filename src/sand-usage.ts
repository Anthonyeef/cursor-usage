/**
 * Grok Bot (Sand) weekly usage helpers.
 *
 * Cursor's dashboard exposes this via the undocumented endpoint
 * POST /api/dashboard/get-sand-usage-status (internal product name: "Sand").
 * Shape may change without notice.
 */

import type { CursorCredentials, SandUsageResult, SandUsageStatus } from './_types.js';
import {
  CURSOR_API_URL_SAND,
  CURSOR_API_URL_SAND_RPC,
  DEFAULT_TIMEOUT,
  USER_AGENT,
} from './_consts.js';
import { authExpiredMessage, buildSessionCookieValue } from './auth.js';
import { logger } from './logger.js';
import { colors } from './table-formatter.js';

function parseSandBody(data: unknown): SandUsageStatus | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  return data as SandUsageStatus;
}

/**
 * Fetch Grok Bot weekly usage. REST first; Connect-RPC Bearer fallback.
 * Failures are soft: callers should treat `ok: false` as "unavailable".
 */
export async function fetchSandUsage(
  credentials: CursorCredentials
): Promise<SandUsageResult> {
  const rest = await fetchSandUsageRest(credentials);
  if (rest.ok) {
    return rest;
  }

  // Auth failures should surface clearly rather than looking like "endpoint gone"
  if (rest.status === 401 || rest.status === 403) {
    return rest;
  }

  const rpc = await fetchSandUsageRpc(credentials);
  if (rpc.ok) {
    return rpc;
  }

  // Prefer the more specific REST reason when both fail
  return {
    ok: false,
    unavailable: true,
    reason: rest.reason || rpc.reason || 'Grok Bot usage unavailable',
    status: rest.status ?? rpc.status,
  };
}

async function fetchSandUsageRest(
  credentials: CursorCredentials
): Promise<SandUsageResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(CURSOR_API_URL_SAND, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Origin: 'https://cursor.com',
        Cookie: buildSessionCookieValue(credentials),
      },
      body: JSON.stringify({}),
      signal: controller.signal,
      redirect: 'manual',
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        unavailable: true,
        reason: authExpiredMessage(),
        status: response.status,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        unavailable: true,
        reason: `Sand REST returned HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = parseSandBody(await response.json());
    if (!data) {
      return {
        ok: false,
        unavailable: true,
        reason: 'Sand REST returned an unexpected body',
        status: response.status,
      };
    }

    return { ok: true, data, source: 'rest' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    logger.debug(`Sand REST fetch failed: ${message}`);
    return {
      ok: false,
      unavailable: true,
      reason: `Sand REST request failed: ${message}`,
    };
  }
}

async function fetchSandUsageRpc(
  credentials: CursorCredentials
): Promise<SandUsageResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(CURSOR_API_URL_SAND_RPC, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Authorization: `Bearer ${credentials.accessToken}`,
        'Connect-Protocol-Version': '1',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        unavailable: true,
        reason: authExpiredMessage(),
        status: response.status,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        unavailable: true,
        reason: `Sand RPC returned HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = parseSandBody(await response.json());
    if (!data) {
      return {
        ok: false,
        unavailable: true,
        reason: 'Sand RPC returned an unexpected body',
        status: response.status,
      };
    }

    return { ok: true, data, source: 'rpc' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    logger.debug(`Sand RPC fetch failed: ${message}`);
    return {
      ok: false,
      unavailable: true,
      reason: `Sand RPC request failed: ${message}`,
    };
  }
}

export function formatLocalDateTime(iso: string | undefined): string {
  if (!iso) {
    return 'N/A';
  }
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

export function sandPlanLabel(data: SandUsageStatus): string {
  return (
    data.grokPlanLabel ||
    data.includedUsageSuperGrokPlan ||
    data.cursorPlanName ||
    'Grok Bot'
  );
}

export function sandUsageToJSON(result: SandUsageResult): Record<string, unknown> {
  if (!result.ok) {
    return {
      available: false,
      reason: result.reason,
      status: result.status ?? null,
    };
  }
  const d = result.data;
  return {
    available: true,
    source: result.source,
    usagePercent: d.usagePercent ?? null,
    hasAvailableUsage: d.hasAvailableUsage ?? null,
    hasNonZeroIncludedLimit: d.hasNonZeroIncludedLimit ?? null,
    planLabel: sandPlanLabel(d),
    cursorPlanName: d.cursorPlanName ?? null,
    grokPlanLabel: d.grokPlanLabel ?? null,
    currentPeriodStart: d.currentPeriodStart ?? null,
    currentPeriodStartLocal: formatLocalDateTime(d.currentPeriodStart),
    nextResetTimestampUtc: d.nextResetTimestampUtc ?? null,
    nextResetLocal: formatLocalDateTime(d.nextResetTimestampUtc),
    billingBrand: d.billingBrand ?? null,
    onDemandSettings: d.onDemandSettings ?? null,
  };
}

/**
 * Print the Grok Bot weekly section (or an unavailable note).
 */
export function displaySandUsage(result: SandUsageResult): void {
  logger.log('');
  logger.log(colors.cyan('🤖 GROK BOT WEEKLY'));

  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      logger.log(`  ${colors.red(result.reason)}`);
    } else {
      logger.log(
        `  ${colors.dim('Unavailable:')} ${colors.yellow(result.reason)}`
      );
      logger.log(
        `  ${colors.dim('(Endpoint is undocumented / may change; IDE usage above is unaffected.)')}`
      );
    }
    return;
  }

  const d = result.data;
  const plan = sandPlanLabel(d);

  logger.log(`  ${colors.dim('Plan:')}            ${colors.yellow(plan)}`);
  if (d.cursorPlanName && d.cursorPlanName !== plan) {
    logger.log(
      `  ${colors.dim('Cursor plan:')}     ${colors.yellow(d.cursorPlanName)}`
    );
  }

  if (d.hasNonZeroIncludedLimit === false) {
    logger.log(
      `  ${colors.dim('Included limit:')}  ${colors.yellow('none for this plan')}`
    );
  } else if (typeof d.usagePercent === 'number') {
    const pct = d.usagePercent.toFixed(1);
    logger.log(
      `  ${colors.dim('Used:')}            ${colors.yellow(pct + '%')} of weekly included`
    );
  } else {
    logger.log(`  ${colors.dim('Used:')}            ${colors.yellow('N/A')}`);
  }

  if (typeof d.hasAvailableUsage === 'boolean') {
    logger.log(
      `  ${colors.dim('Available:')}       ${
        d.hasAvailableUsage ? colors.green('yes') : colors.red('no')
      }`
    );
  }

  logger.log(
    `  ${colors.dim('Period start:')}    ${colors.yellow(formatLocalDateTime(d.currentPeriodStart))}`
  );
  logger.log(
    `  ${colors.dim('Next reset:')}      ${colors.yellow(formatLocalDateTime(d.nextResetTimestampUtc))}`
  );

  const od = d.onDemandSettings;
  if (od && (od.visible || od.eligible || typeof od.enabled === 'boolean')) {
    const bits: string[] = [];
    if (typeof od.enabled === 'boolean') {
      bits.push(od.enabled ? 'enabled' : 'disabled');
    }
    if (od.eligible) {
      bits.push('eligible');
    }
    if (od.visible) {
      bits.push('visible');
    }
    logger.log(
      `  ${colors.dim('On-demand:')}       ${colors.yellow(bits.join(', ') || 'n/a')}`
    );
  }
}
