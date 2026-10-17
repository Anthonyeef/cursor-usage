/**
 * Constants for Cursor usage analyzer
 */

import { homedir } from 'node:os';
import { join } from 'node:path';

export const CURSOR_DB_PATH = join(
  homedir(),
  'Library/Application Support/Cursor/User/globalStorage/state.vscdb'
);

export const CURSOR_API_URL = 'https://cursor.com/api/usage-summary';

export const CURSOR_API_URL_EVENTS =
  'https://cursor.com/api/dashboard/get-filtered-usage-events';

/** Grok Bot weekly usage (Cursor internal name: "Sand"). Undocumented; may change. */
export const CURSOR_API_URL_SAND =
  'https://cursor.com/api/dashboard/get-sand-usage-status';

/** Connect-RPC fallback for Grok Bot (Sand) usage status. */
export const CURSOR_API_URL_SAND_RPC =
  'https://api2.cursor.sh/aiserver.v1.DashboardService/GetSandUsageStatus';

export const CURSOR_DATA_DIR_ENV = 'CURSOR_DATA_DIR';

/** Full session cookie value: `userId::jwt` or URL-encoded `userId%3A%3Ajwt`. */
export const CURSOR_SESSION_TOKEN_ENV = 'CURSOR_SESSION_TOKEN';

/** Access JWT only; user id is taken from the JWT `sub` claim when possible. */
export const CURSOR_ACCESS_TOKEN_ENV = 'CURSOR_ACCESS_TOKEN';

// Database keys
export const DB_KEY_STATSIG_BOOTSTRAP = 'workbench.experiments.statsigBootstrap';
export const DB_KEY_ACCESS_TOKEN = 'cursorAuth/accessToken';
export const DB_KEY_EMAIL = 'cursorAuth/cachedEmail';
export const DB_KEY_MEMBERSHIP = 'cursorAuth/stripeMembershipType';

export const DEFAULT_TIMEOUT = 10000; // 10 seconds

export const USER_AGENT = 'Mozilla/5.0 (compatible; cursor-usage/0.2.0)';
