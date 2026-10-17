/**
 * Credential resolution: --token / env vars / Cursor IDE local database.
 * Does not read or decrypt Grok Bot sand-secrets or Keychain items.
 */

import type { CursorCredentials } from './_types.js';
import {
  CURSOR_ACCESS_TOKEN_ENV,
  CURSOR_SESSION_TOKEN_ENV,
} from './_consts.js';
import { getCursorCredentialsFromDatabase } from './data-loader.js';
import { logger } from './logger.js';

export interface AuthOptions {
  /** Raw token from `--token` (session `userId::jwt` or bare JWT). */
  tokenFlag?: string;
}

/**
 * Decode a JWT payload without verifying the signature.
 */
export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4;
    if (pad) {
      payload += '='.repeat(4 - pad);
    }
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

/**
 * Return true when the JWT `exp` claim is in the past (or missing/unreadable → false).
 */
export function isJwtExpired(accessToken: string, skewSeconds = 60): boolean {
  const payload = decodeJwtPayload(accessToken);
  const exp = payload?.exp;
  if (typeof exp !== 'number') {
    return false;
  }
  return exp < Date.now() / 1000 - skewSeconds;
}

/**
 * Parse `userId::jwt`, URL-encoded `userId%3A%3Ajwt`, or a bare JWT.
 */
export function parseSessionToken(
  raw: string
): { userId: string; accessToken: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let value = trimmed;
  try {
    // Decode once if it looks URL-encoded (`%3A%3A` for `::`)
    if (/%3A%3A/i.test(value) || /%7C/i.test(value)) {
      value = decodeURIComponent(value);
    }
  } catch {
    // keep original
  }

  const sep = '::';
  const idx = value.indexOf(sep);
  if (idx > 0) {
    const userId = value.slice(0, idx);
    const accessToken = value.slice(idx + sep.length);
    if (userId && accessToken) {
      return { userId, accessToken };
    }
  }

  // Bare JWT — derive user id from `sub`
  if (value.split('.').length >= 3) {
    const payload = decodeJwtPayload(value);
    const sub = payload?.sub;
    if (typeof sub === 'string' && sub.length > 0) {
      return { userId: sub, accessToken: value };
    }
  }

  return null;
}

function credentialsFromTokenString(
  raw: string,
  source: CursorCredentials['source']
): CursorCredentials | null {
  const parsed = parseSessionToken(raw);
  if (!parsed) {
    return null;
  }
  return {
    userId: parsed.userId,
    accessToken: parsed.accessToken,
    source,
  };
}

/**
 * Resolve credentials in order: --token → CURSOR_SESSION_TOKEN →
 * CURSOR_ACCESS_TOKEN → Cursor IDE state.vscdb.
 */
export async function resolveCredentials(
  options: AuthOptions = {}
): Promise<CursorCredentials | null> {
  if (options.tokenFlag && typeof options.tokenFlag === 'string') {
    const fromFlag = credentialsFromTokenString(options.tokenFlag, 'flag');
    if (fromFlag) {
      logger.debug('Using credentials from --token');
      warnIfExpired(fromFlag);
      return fromFlag;
    }
    logger.error(
      'Invalid --token value. Expected `userId::jwt`, URL-encoded session cookie, or a bare JWT.'
    );
    return null;
  }

  const sessionEnv = process.env[CURSOR_SESSION_TOKEN_ENV];
  if (sessionEnv) {
    const fromEnv = credentialsFromTokenString(sessionEnv, 'env');
    if (fromEnv) {
      logger.debug(`Using credentials from ${CURSOR_SESSION_TOKEN_ENV}`);
      warnIfExpired(fromEnv);
      return fromEnv;
    }
    logger.error(
      `Invalid ${CURSOR_SESSION_TOKEN_ENV}. Expected \`userId::jwt\`, URL-encoded session cookie, or a bare JWT.`
    );
    return null;
  }

  const accessEnv = process.env[CURSOR_ACCESS_TOKEN_ENV];
  if (accessEnv) {
    const fromEnv = credentialsFromTokenString(accessEnv, 'env');
    if (fromEnv) {
      logger.debug(`Using credentials from ${CURSOR_ACCESS_TOKEN_ENV}`);
      warnIfExpired(fromEnv);
      return fromEnv;
    }
    logger.error(
      `Invalid ${CURSOR_ACCESS_TOKEN_ENV}. Expected a JWT (user id is read from the \`sub\` claim).`
    );
    return null;
  }

  const fromDb = await getCursorCredentialsFromDatabase();
  if (fromDb) {
    logger.debug('Using credentials from Cursor IDE local database');
    warnIfExpired(fromDb);
    return fromDb;
  }

  logger.error(
    'Failed to load credentials. Sign in to the Cursor app, or set CURSOR_SESSION_TOKEN / CURSOR_ACCESS_TOKEN, or pass --token.'
  );
  return null;
}

function warnIfExpired(credentials: CursorCredentials): void {
  if (isJwtExpired(credentials.accessToken)) {
    logger.warn(
      'Local access token looks expired. If API calls fail with 401, re-sign into Cursor or pass a fresh --token / CURSOR_SESSION_TOKEN.'
    );
  }
}

/**
 * Shared auth error text for HTTP 401 responses.
 */
export function authExpiredMessage(): string {
  return (
    'Authentication failed (401). Your Cursor session is missing or expired. ' +
    'Re-sign into the Cursor app, or pass a fresh token via --token or ' +
    'CURSOR_SESSION_TOKEN / CURSOR_ACCESS_TOKEN.'
  );
}

/**
 * Build the WorkosCursorSessionToken cookie header value (not the full Cookie header).
 */
export function buildSessionCookieValue(credentials: CursorCredentials): string {
  const sessionToken = `${credentials.userId}::${credentials.accessToken}`;
  return `WorkosCursorSessionToken=${encodeURIComponent(sessionToken)}`;
}
