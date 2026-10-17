/**
 * Data loading utilities for Cursor usage analysis
 * Extracts credentials from local database and fetches usage data from API
 */

import type { CursorCredentials, UsageSummary } from './_types.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CURSOR_API_URL,
  CURSOR_DB_PATH,
  CURSOR_DATA_DIR_ENV,
  DB_KEY_ACCESS_TOKEN,
  DB_KEY_EMAIL,
  DB_KEY_MEMBERSHIP,
  DB_KEY_STATSIG_BOOTSTRAP,
  DEFAULT_TIMEOUT,
  USER_AGENT,
} from './_consts.js';
import { logger } from './logger.js';
import initSqlJs from 'sql.js';

let sqlJs: any = null;

async function initSql() {
  if (!sqlJs) {
    sqlJs = await initSqlJs();
  }
  return sqlJs;
}

function queryDB(db: any, key: string): string | null {
  try {
    const stmt = db.prepare(`SELECT value FROM ItemTable WHERE key = ?`);
    stmt.bind([key]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      return (row as any).value || null;
    }
    stmt.free();
    return null;
  } catch {
    return null;
  }
}

function resolveDbPath(): string {
  const custom = process.env[CURSOR_DATA_DIR_ENV];
  if (custom) {
    return join(custom, 'User/globalStorage/state.vscdb');
  }
  return CURSOR_DB_PATH;
}

function cookieHeader(credentials: CursorCredentials): string {
  const sessionToken = `${credentials.userId}::${credentials.accessToken}`;
  return `WorkosCursorSessionToken=${encodeURIComponent(sessionToken)}`;
}

/**
 * Extract Cursor credentials from the Cursor IDE local database only.
 */
export async function getCursorCredentialsFromDatabase(): Promise<CursorCredentials | null> {
  try {
    const dbPath = resolveDbPath();
    if (!existsSync(dbPath)) {
      logger.debug(`Cursor database not found at ${dbPath}`);
      return null;
    }

    const sql = await initSql();
    const data = readFileSync(dbPath);
    const db = new sql.Database(data);

    let userId: string | null = null;
    const bootstrapValue = queryDB(db, DB_KEY_STATSIG_BOOTSTRAP);
    if (bootstrapValue) {
      try {
        const parsed = JSON.parse(bootstrapValue);
        userId = parsed?.user?.userID;
      } catch {
        logger.warn('Failed to extract user ID from statsigBootstrap');
      }
    }

    const accessToken = queryDB(db, DB_KEY_ACCESS_TOKEN);
    const email = queryDB(db, DB_KEY_EMAIL) || undefined;
    const membership = queryDB(db, DB_KEY_MEMBERSHIP) || undefined;

    db.close();

    if (!userId) {
      logger.debug('Could not extract user ID from database');
      return null;
    }

    if (!accessToken) {
      logger.debug('Could not extract access token from database');
      return null;
    }

    return {
      userId,
      accessToken,
      email,
      membership,
      source: 'database',
    };
  } catch (error) {
    logger.debug(`Error reading database: ${String(error)}`);
    return null;
  }
}

/**
 * @deprecated Prefer resolveCredentials() from auth.ts
 */
export async function getCursorCredentials(): Promise<CursorCredentials | null> {
  return getCursorCredentialsFromDatabase();
}

/**
 * Fetch IDE usage summary from Cursor API
 */
export async function fetchUsageData(
  credentials: CursorCredentials
): Promise<UsageSummary | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(CURSOR_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Cookie: cookieHeader(credentials),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      logger.error(
        'Authentication failed (401). Your Cursor session is missing or expired. ' +
          'Re-sign into the Cursor app, or pass a fresh token via --token or ' +
          'CURSOR_SESSION_TOKEN / CURSOR_ACCESS_TOKEN.'
      );
      return null;
    }

    if (!response.ok) {
      logger.error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as unknown;
    return validateAndParse(data);
  } catch (error) {
    logger.error(`Error fetching usage data: ${String(error)}`);
    return null;
  }
}

function validateAndParse(data: unknown): UsageSummary | null {
  try {
    if (typeof data !== 'object' || data === null) {
      logger.error('Invalid API response format');
      return null;
    }

    return data as UsageSummary;
  } catch (error) {
    logger.error(`Error parsing API response: ${String(error)}`);
    return null;
  }
}
