/**
 * Data loading utilities for Cursor usage analysis
 * Extracts credentials from local database and fetches usage data from API
 */

import type { CursorCredentials, UsageSummary } from './_types';
import { readFileSync } from 'node:fs';
import {
  CURSOR_API_URL,
  CURSOR_DB_PATH,
  DB_KEY_ACCESS_TOKEN,
  DB_KEY_EMAIL,
  DB_KEY_MEMBERSHIP,
  DB_KEY_STATSIG_BOOTSTRAP,
  DEFAULT_TIMEOUT,
  USER_AGENT,
} from './_consts';
import { logger } from './logger';
import initSqlJs from 'sql.js';

let sqlJs: any = null;

/**
 * Initialize SQL.js
 */
async function initSql() {
  if (!sqlJs) {
    sqlJs = await initSqlJs();
  }
  return sqlJs;
}

/**
 * Query database value
 */
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

/**
 * Extract Cursor credentials from local database
 */
export async function getCursorCredentials(): Promise<CursorCredentials | null> {
  try {
    const sql = await initSql();
    const data = readFileSync(CURSOR_DB_PATH);
    const db = new sql.Database(data);

    // Get user ID from statsigBootstrap
    let userId: string | null = null;
    const bootstrapValue = queryDB(db, DB_KEY_STATSIG_BOOTSTRAP);
    if (bootstrapValue) {
      try {
        const parsed = JSON.parse(bootstrapValue);
        userId = parsed?.user?.userID;
      } catch (e) {
        logger.warn('Failed to extract user ID from statsigBootstrap');
      }
    }

    // Get access token
    const accessToken = queryDB(db, DB_KEY_ACCESS_TOKEN);

    // Get email
    const email = queryDB(db, DB_KEY_EMAIL) || undefined;

    // Get membership
    const membership = queryDB(db, DB_KEY_MEMBERSHIP) || undefined;

    db.close();

    if (!userId) {
      logger.error('Could not extract user ID from database');
      return null;
    }

    if (!accessToken) {
      logger.error('Could not extract access token from database');
      return null;
    }

    return {
      userId,
      accessToken,
      email,
      membership,
    };
  } catch (error) {
    logger.error(`Error reading database: ${String(error)}`);
    return null;
  }
}

/**
 * Fetch usage data from Cursor API
 */
export async function fetchUsageData(
  credentials: CursorCredentials
): Promise<UsageSummary | null> {
  try {
    const sessionToken = `${credentials.userId}::${credentials.accessToken}`;

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };

    const cookieHeader = `WorkosCursorSessionToken=${encodeURIComponent(
      sessionToken
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const response = await fetch(CURSOR_API_URL, {
      method: 'GET',
      headers: {
        ...headers,
        Cookie: cookieHeader,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

/**
 * Validate and parse API response
 */
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


