/**
 * Lightweight tests for Grok Bot (Sand) helpers — no network, no secrets.
 * Run: npm test
 */

import assert from 'node:assert/strict';
import {
  parseSessionToken,
  decodeJwtPayload,
  isJwtExpired,
  buildSessionCookieValue,
} from './auth.js';
import {
  formatLocalDateTime,
  sandPlanLabel,
  sandUsageToJSON,
} from './sand-usage.js';
import type { SandUsageResult, SandUsageStatus } from './_types.js';

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

async function run() {
  // parseSessionToken
  const jwt = makeJwt({ sub: 'user_01TEST', exp: Math.floor(Date.now() / 1000) + 3600 });
  const a = parseSessionToken(`user_01TEST::${jwt}`);
  assert.equal(a?.userId, 'user_01TEST');
  assert.equal(a?.accessToken, jwt);

  const encoded = encodeURIComponent(`google-oauth2|user_01TEST::${jwt}`);
  const b = parseSessionToken(encoded);
  assert.equal(b?.userId, 'google-oauth2|user_01TEST');
  assert.equal(b?.accessToken, jwt);

  const c = parseSessionToken(jwt);
  assert.equal(c?.userId, 'user_01TEST');

  assert.equal(parseSessionToken(''), null);
  assert.equal(parseSessionToken('not-a-token'), null);

  // JWT helpers
  const payload = decodeJwtPayload(jwt);
  assert.equal(payload?.sub, 'user_01TEST');
  assert.equal(isJwtExpired(jwt), false);

  const expired = makeJwt({
    sub: 'user_01TEST',
    exp: Math.floor(Date.now() / 1000) - 120,
  });
  assert.equal(isJwtExpired(expired), true);

  // Cookie builder
  const cookie = buildSessionCookieValue({
    userId: 'user_01TEST',
    accessToken: jwt,
  });
  assert.ok(cookie.startsWith('WorkosCursorSessionToken='));
  assert.ok(cookie.includes(encodeURIComponent('::')));

  // Sand display helpers
  const data: SandUsageStatus = {
    usagePercent: 42.5,
    hasAvailableUsage: true,
    hasNonZeroIncludedLimit: true,
    grokPlanLabel: 'Grok Bot Plan',
    cursorPlanName: 'Pro',
    currentPeriodStart: '2026-10-10T16:41:31.812Z',
    nextResetTimestampUtc: '2026-10-17T16:41:31.812Z',
  };
  assert.equal(sandPlanLabel(data), 'Grok Bot Plan');
  assert.notEqual(formatLocalDateTime(data.currentPeriodStart), 'N/A');
  assert.equal(formatLocalDateTime(undefined), 'N/A');

  const ok: SandUsageResult = { ok: true, data, source: 'rest' };
  const jsonOk = sandUsageToJSON(ok);
  assert.equal(jsonOk.available, true);
  assert.equal(jsonOk.usagePercent, 42.5);

  const bad: SandUsageResult = {
    ok: false,
    unavailable: true,
    reason: 'Sand REST returned HTTP 404',
    status: 404,
  };
  const jsonBad = sandUsageToJSON(bad);
  assert.equal(jsonBad.available, false);
  assert.equal(jsonBad.status, 404);

  // Mocked fetchSandUsage via global fetch
  const { fetchSandUsage } = await import('./sand-usage.js');
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        usagePercent: 10,
        hasAvailableUsage: true,
        hasNonZeroIncludedLimit: true,
        grokPlanLabel: 'Mock Plan',
        currentPeriodStart: '2026-10-01T00:00:00.000Z',
        nextResetTimestampUtc: '2026-10-08T00:00:00.000Z',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )) as typeof fetch;

  const mocked = await fetchSandUsage({
    userId: 'user_01TEST',
    accessToken: jwt,
  });
  assert.equal(mocked.ok, true);
  if (mocked.ok) {
    assert.equal(mocked.data.usagePercent, 10);
    assert.equal(mocked.source, 'rest');
  }

  // Soft-fail on 404 then RPC also fails
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response('nope', { status: 404 });
  }) as typeof fetch;

  const missing = await fetchSandUsage({
    userId: 'user_01TEST',
    accessToken: jwt,
  });
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.unavailable, true);
  }
  assert.ok(calls >= 1);

  // 401 surfaces auth message
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'not_authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

  const unauth = await fetchSandUsage({
    userId: 'user_01TEST',
    accessToken: jwt,
  });
  assert.equal(unauth.ok, false);
  if (!unauth.ok) {
    assert.equal(unauth.status, 401);
    assert.match(unauth.reason, /401|expired|Re-sign/i);
  }

  globalThis.fetch = originalFetch;

  console.log('All sand-usage / auth tests passed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
