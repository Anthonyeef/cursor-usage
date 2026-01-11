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

export const CURSOR_API_URL_EVENTS = 'https://cursor.com/api/dashboard/get-filtered-usage-events';

export const CURSOR_DATA_DIR_ENV = 'CURSOR_DATA_DIR';

// Database keys
export const DB_KEY_STATSIG_BOOTSTRAP = 'workbench.experiments.statsigBootstrap';
export const DB_KEY_ACCESS_TOKEN = 'cursorAuth/accessToken';
export const DB_KEY_EMAIL = 'cursorAuth/cachedEmail';
export const DB_KEY_MEMBERSHIP = 'cursorAuth/stripeMembershipType';

export const DEFAULT_TIMEOUT = 10000; // 10 seconds

export const USER_AGENT = 'Mozilla/5.0 (compatible; cursor-usage/1.0)';
