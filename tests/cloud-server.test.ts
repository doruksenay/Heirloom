// The cloud Worker's logic (server/src/logic.ts) against the in-memory store.
import { describe, expect, it } from 'vitest';
import { Api, LIMITS, cleanNickname, type ApiResponse } from '../server/src/logic';
import { MemoryStore } from '../server/src/store';
import { checkScores, planCategories } from '../server/src/plan';
import { GRANTABLE } from '../server/src/products';
import { normalizeFamilyCode, normalizeGiftCode } from '../server/src/crypto';
import { dailyPlan } from '../src/engine/daily';
import { PRODUCTS } from '../src/platform/purchases';

const ADMIN = 'admin-token-for-tests-0123456789';
const ENV = { PEPPER: 'pepper-for-tests-0123456789abcdef', ADMIN_TOKEN: ADMIN };
const T0 = Date.parse('2026-10-29T12:00:00Z');
const TODAY = '2026-10-29';

function setup(env: Record<string, string | undefined> = ENV) {
  const store = new MemoryStore();
  const clock = { now: T0 };
  const api = new Api(store, env, { now: () => clock.now });
  return { store, api, clock };
}

interface CallOpts {
  body?: unknown;
  device?: [string, string];
  bearer?: string;
  origin?: string;
  ip?: string;
}

async function call(api: Api, method: string, path: string, o: CallOpts = {}): Promise<ApiResponse & { json: any }> {
  const url = new URL(`https://x${path}`);
  const headers: Record<string, string> = {};
  if (o.device) headers.authorization = `Device ${o.device[0]}.${o.device[1]}`;
  if (o.bearer) headers.authorization = `Bearer ${o.bearer}`;
  if (o.origin) headers.origin = o.origin;
  const res = await api.handle({
    method,
    path: url.pathname,
    query: url.searchParams,
    header: (n) => headers[n.toLowerCase()] ?? null,
    ip: o.ip ?? '203.0.113.7',
    body: o.body === undefined ? '' : typeof o.body === 'string' ? o.body : JSON.stringify(o.body),
  });
  let json: any = null;
  try {
    json = JSON.parse(res.body);
  } catch {
    /* html */
  }
  return { ...res, json };
}

let n = 0;
const newDevice = (): [string, string] => {
  n++;
  return [`device${String(n).padStart(4, '0')}abcdefghijkl`, `secret${String(n).padStart(4, '0')}abcdefghijklmnopqrstuvwxyz0123`];
};

/** Plausible scores for the day's categories. */
function scoresFor(date: string, v = 1): Record<string, number> {
  const base: Record<string, number> = { wealth: 100_000 * v, age: 60 + v, family: v, pets: v, salary: 50_000 * v, loved: v, fame: 1000 * v, company: 50_000 * v };
  return Object.fromEntries(planCategories(date).map((c) => [c, base[c]]));
}

describe('cloud: plan and catalog stay in step with the game', () => {
  it('server categories match dailyPlan for a whole year', () => {
    for (let i = 0; i < 400; i++) {
      const date = new Date(Date.parse('2026-01-01T00:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
      expect(planCategories(date), date).toEqual(dailyPlan(date).categories);
    }
  });

  it('grantable ids are exactly the store products', () => {
    expect([...GRANTABLE].sort()).toEqual(PRODUCTS.filter((p) => !p.free && !p.comingSoon).map((p) => p.id).sort());
  });

  it('normalizes codes', () => {
    expect(normalizeFamilyCode('hlm 7k2q 9xpa')).toBe('HLM-7K2Q-9XPA');
    expect(normalizeFamilyCode('7K2Q9XPA')).toBe('HLM-7K2Q-9XPA');
    expect(normalizeFamilyCode('HLM-7K2Q-9XP')).toBeNull();
    expect(normalizeFamilyCode('HLM-0K2Q-9XPA')).toBeNull(); // 0 is not in the alphabet
    expect(normalizeGiftCode(' launch-2026 ')).toBe('LAUNCH-2026');
    expect(normalizeGiftCode('a')).toBeNull();
    expect(normalizeGiftCode('<script>')).toBeNull();
  });

  it('cleans nicknames', () => {
    expect(cleanNickname('  Ayşe   K. ')).toBe('Ayşe K.');
    expect(cleanNickname('<b>x</b>')).toBeNull();
    expect(cleanNickname('')).toBeNull();
    expect(cleanNickname(undefined)).toBeUndefined();
    expect(cleanNickname('x'.repeat(40))?.length).toBe(LIMITS.nickname);
  });
});

describe('cloud: family code saves', () => {
  it('registers a device once and keeps only hashes', async () => {
    const { api, store } = setup();
    const dev = newDevice();
    const a = await call(api, 'POST', '/v1/hello', { device: dev, body: { generation: 3, packs: ['pack.fame', 'bad id'] } });
    expect(a.status).toBe(200);
    expect(a.json.code).toMatch(/^HLM-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    expect(a.json.pin).toMatch(/^\d{6}$/);
    const row = store.players.get(dev[0])!;
    expect(row.secret_hash).not.toContain(dev[1]);
    expect(row.pin_hash).not.toContain(a.json.pin);
    expect(row.generation).toBe(3);
    expect(JSON.parse(row.packs)).toEqual(['pack.fame']);
    const b = await call(api, 'POST', '/v1/hello', { device: dev });
    expect(b.json.code).toBe(a.json.code);
    expect(b.json.pin).toBeUndefined(); // the PIN is shown once
    const wrong = await call(api, 'POST', '/v1/hello', { device: [dev[0], 'x'.repeat(40)] });
    expect(wrong.status).toBe(401);
    expect((await call(api, 'POST', '/v1/hello')).status).toBe(401);
  });

  it('saves, restores on a new phone and retires the old secret', async () => {
    const { api } = setup();
    const oldPhone = newDevice();
    const saved = await call(api, 'POST', '/v1/save', { device: oldPhone, body: { enc: 'json', data: '{"family":{"x":1}}', generation: 2 } });
    expect(saved.status).toBe(200);
    const { code, pin } = saved.json;

    const newPhone = newDevice();
    const bad = await call(api, 'POST', '/v1/restore', { device: newPhone, body: { code, pin: pin === '000000' ? '111111' : '000000' } });
    expect(bad.status).toBe(403);
    const ok = await call(api, 'POST', '/v1/restore', { device: newPhone, body: { code: code.toLowerCase().replace(/-/g, ' '), pin } });
    expect(ok.status).toBe(200);
    expect(ok.json.id).toBe(oldPhone[0]);
    expect(ok.json.save).toMatchObject({ enc: 'json', data: '{"family":{"x":1}}' });
    expect(ok.json.secret).toMatch(/^[A-Za-z0-9_-]{43}$/);

    // the old phone is told the family moved; the new one carries on
    expect((await call(api, 'POST', '/v1/save', { device: oldPhone, body: { enc: 'json', data: '{}' } })).status).toBe(401);
    const again = await call(api, 'POST', '/v1/save', { device: [ok.json.id, ok.json.secret], body: { enc: 'json', data: '{"y":2}' } });
    expect(again.status).toBe(200);
    expect(again.json.code).toBe(code);
  });

  it('rate-limits PIN guessing per family code', async () => {
    const { api, clock } = setup();
    const dev = newDevice();
    const { code } = (await call(api, 'POST', '/v1/hello', { device: dev })).json;
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) statuses.push((await call(api, 'POST', '/v1/restore', { body: { code, pin: String(100000 + i) }, ip: `198.51.100.${i}` })).status);
    expect(statuses.slice(0, LIMITS.restorePerCodePerHour).every((s) => s === 403)).toBe(true);
    expect(statuses.slice(LIMITS.restorePerCodePerHour).every((s) => s === 429)).toBe(true);
    clock.now += 3_600_000;
    expect((await call(api, 'POST', '/v1/restore', { body: { code, pin: '123456' }, ip: '198.51.100.99' })).status).toBe(403);
  });

  it('rate-limits restores per IP', async () => {
    const { api } = setup();
    const statuses: number[] = [];
    for (let i = 0; i < LIMITS.restorePerHour + 2; i++) statuses.push((await call(api, 'POST', '/v1/restore', { body: { code: `HLM-2222-22${i < 8 ? 2 + i : 'A' + i}`.slice(0, 13), pin: '123456' } })).status);
    expect(statuses[statuses.length - 1]).toBe(429);
  });

  it('enforces size limits and formats', async () => {
    const { api } = setup();
    const dev = newDevice();
    const big = await call(api, 'POST', '/v1/save', { device: dev, body: { enc: 'gzip64', data: 'A'.repeat(LIMITS.saveChars + 4) } });
    expect(big.status).toBe(413);
    expect((await call(api, 'POST', '/v1/save', { device: dev, body: { enc: 'gzip64', data: 'not base64!' } })).status).toBe(400);
    expect((await call(api, 'POST', '/v1/save', { device: dev, body: { enc: 'zip', data: 'AAAA' } })).status).toBe(400);
    expect((await call(api, 'POST', '/v1/hello', { device: dev, body: 'x'.repeat(LIMITS.smallBody + 1) })).status).toBe(413);
    expect((await call(api, 'POST', '/v1/hello', { device: dev, body: '[1,2]' })).status).toBe(400);
    expect((await call(api, 'POST', '/v1/save', { device: dev, body: { enc: 'gzip64', data: 'H4sIAAAAAAAAA6tWSs7PS8tMBwBsVdCtCgAAAA==' } })).status).toBe(200);
  });

  it('a new PIN replaces the old one', async () => {
    const { api } = setup();
    const dev = newDevice();
    const first = (await call(api, 'POST', '/v1/hello', { device: dev })).json;
    const next = (await call(api, 'POST', '/v1/pin', { device: dev })).json;
    expect(next.code).toBe(first.code);
    if (next.pin !== first.pin) expect((await call(api, 'POST', '/v1/restore', { body: { code: first.code, pin: first.pin } })).status).toBe(403);
    expect((await call(api, 'POST', '/v1/restore', { body: { code: first.code, pin: next.pin } })).status).toBe(200);
  });

  it('DELETE /v1/me erases the player, the save and Daily entries', async () => {
    const { api, store } = setup();
    const dev = newDevice();
    await call(api, 'POST', '/v1/save', { device: dev, body: { enc: 'json', data: '{}' } });
    await call(api, 'POST', '/v1/daily', { device: dev, body: { date: TODAY, scores: scoresFor(TODAY) } });
    expect(store.daily.size).toBe(1);
    const del = await call(api, 'DELETE', '/v1/me', { device: dev });
    expect(del.json).toEqual({ deleted: true });
    expect(store.players.size + store.saves.size + store.daily.size).toBe(0);
    expect((await call(api, 'DELETE', '/v1/me', { device: dev })).status).toBe(401);
  });

  it('refuses everything without a pepper', async () => {
    const { api } = setup({ ADMIN_TOKEN: ADMIN });
    expect((await call(api, 'POST', '/v1/hello', { device: newDevice() })).status).toBe(503);
    expect((await call(api, 'GET', '/v1/health')).status).toBe(200);
  });
});

describe('cloud: Daily leaderboard', () => {
  it('rejects implausible scores', () => {
    const cats = planCategories(TODAY);
    expect(checkScores(TODAY, scoresFor(TODAY))).toBeNull();
    expect(checkScores(TODAY, { ...scoresFor(TODAY), extra: 1 })).toBe('categories');
    expect(checkScores(TODAY, { [cats[0]]: 1.5, [cats[1]]: 1, [cats[2]]: 1 })).toMatch(/^value/);
    const huge = scoresFor(TODAY);
    huge[cats[0]] = 1e15;
    expect(checkScores(TODAY, huge)).toMatch(/^range/);
    // a day with age and salary: a 9-year-old has no salary
    const day = Array.from({ length: 60 }, (_, i) => new Date(T0 + i * 86_400_000).toISOString().slice(0, 10)).find((d) => {
      const c = planCategories(d);
      return c.includes('age') && c.includes('salary');
    })!;
    expect(checkScores(day, { ...scoresFor(day), age: 9, salary: 40_000 })).toBe('too young');
  });

  it('takes one entry per install per day and only recent dates', async () => {
    const { api } = setup();
    const dev = newDevice();
    const first = await call(api, 'POST', '/v1/daily', { device: dev, body: { date: TODAY, scores: scoresFor(TODAY), nickname: 'Ada' } });
    expect(first.json).toMatchObject({ ok: true, duplicate: false });
    const second = await call(api, 'POST', '/v1/daily', { device: dev, body: { date: TODAY, scores: scoresFor(TODAY, 9) } });
    expect(second.json.duplicate).toBe(true);
    expect((await call(api, 'POST', '/v1/daily', { device: dev, body: { date: '2026-10-20', scores: scoresFor('2026-10-20') } })).status).toBe(400);
    expect((await call(api, 'POST', '/v1/daily', { device: dev, body: { date: '2026-11-05', scores: scoresFor('2026-11-05') } })).status).toBe(400);
    expect((await call(api, 'POST', '/v1/daily', { device: dev, body: { date: TODAY, scores: { wealth: 1 } } })).status).toBe(422);
    const board = (await call(api, 'GET', `/v1/daily/${TODAY}`)).json;
    expect(board.n).toBe(1);
    expect(board.top[0].scores).toEqual(scoresFor(TODAY)); // the first entry counts
  });

  it('returns sorted values and a top 20 by share of players beaten', async () => {
    const { api, clock } = setup();
    for (let i = 1; i <= 30; i++) {
      await call(api, 'POST', '/v1/daily', { device: newDevice(), body: { date: TODAY, scores: scoresFor(TODAY, i), nickname: i === 30 ? 'Best' : undefined }, ip: `192.0.2.${i}` });
    }
    clock.now += 61_000; // past the minute-long cache
    const res = await call(api, 'GET', `/v1/daily/${TODAY}`);
    expect(res.headers['Cache-Control']).toBe('public, max-age=60');
    const b = res.json;
    expect(b.n).toBe(30);
    expect(b.categories).toEqual(planCategories(TODAY));
    for (const c of b.categories) {
      expect(b.values[c]).toHaveLength(30);
      expect([...b.values[c]].sort((x: number, y: number) => x - y)).toEqual(b.values[c]);
    }
    expect(b.top).toHaveLength(20);
    expect(b.top[0]).toMatchObject({ name: 'Best', score: 100 });
    expect(b.top[1].name).toBeNull();
    expect(b.top[0].tag).toMatch(/^[0-9a-f]{6}$/);
    expect(JSON.stringify(b)).not.toContain('device00'); // no install ids on the public board
  });

  it('limits Daily entries per IP', async () => {
    const { api } = setup();
    let last = 0;
    for (let i = 0; i <= LIMITS.dailyPerDay; i++) last = (await call(api, 'POST', '/v1/daily', { device: newDevice(), body: { date: TODAY, scores: scoresFor(TODAY) } })).status;
    expect(last).toBe(429);
  });
});

describe('cloud: gift codes and admin', () => {
  it('admin needs the token and locks out guessers', async () => {
    expect((await call(setup({ PEPPER: ENV.PEPPER }).api, 'GET', '/admin/api/stats', { bearer: 'x' })).status).toBe(503);
    const { api } = setup();
    expect((await call(api, 'GET', '/admin/api/stats')).status).toBe(401);
    expect((await call(api, 'GET', '/admin/api/stats', { bearer: ADMIN })).status).toBe(200);
    for (let i = 0; i < LIMITS.adminFailsPerHour; i++) await call(api, 'GET', '/admin/api/stats', { bearer: `guess-${i}` });
    expect((await call(api, 'GET', '/admin/api/stats', { bearer: ADMIN })).status).toBe(429);
    expect((await call(api, 'GET', '/admin/api/stats', { bearer: ADMIN, ip: '192.0.2.200' })).status).toBe(200);
  });

  it('serves the admin page with a strict CSP', async () => {
    const res = await call(setup().api, 'GET', '/admin');
    expect(res.status).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/html');
    const nonce = /'nonce-([^']+)'/.exec(res.headers['Content-Security-Policy'])![1];
    expect(res.body).toContain(`<script nonce="${nonce}">`);
    expect(res.headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  });

  it('lists players without secrets and grants entitlements', async () => {
    const { api } = setup();
    const dev = newDevice();
    await call(api, 'POST', '/v1/hello', { device: dev, body: { nickname: 'Can', generation: 4 } });
    const list = await call(api, 'GET', '/admin/api/players?q=can', { bearer: ADMIN });
    expect(list.json.players).toHaveLength(1);
    expect(list.json.players[0]).toMatchObject({ id: dev[0], nickname: 'Can', generation: 4, grants: [] });
    expect(list.body).not.toMatch(/secret_hash|pin_hash/);
    expect((await call(api, 'POST', `/admin/api/players/${dev[0]}`, { bearer: ADMIN, body: { grants: ['pack.fame', 'bogus'] } })).status).toBe(400);
    expect((await call(api, 'POST', `/admin/api/players/${dev[0]}`, { bearer: ADMIN, body: { grants: ['bundle.all', 'premium.no_ads'] } })).status).toBe(200);
    expect((await call(api, 'POST', '/v1/hello', { device: dev })).json.grants).toEqual(['bundle.all', 'premium.no_ads']);
    await call(api, 'POST', `/admin/api/players/${dev[0]}`, { bearer: ADMIN, body: { grants: [], clearNickname: true } });
    const after = (await call(api, 'GET', '/admin/api/players', { bearer: ADMIN })).json.players[0];
    expect(after).toMatchObject({ grants: [], nickname: null });
    expect((await call(api, 'DELETE', `/admin/api/players/${dev[0]}`, { bearer: ADMIN })).json.deleted).toBe(true);
    expect((await call(api, 'GET', '/admin/api/stats', { bearer: ADMIN })).json.players).toBe(0);
  });

  it('gift codes grant once per player, up to their uses, until they expire', async () => {
    const { api, clock } = setup();
    const made = await call(api, 'POST', '/admin/api/gifts', { bearer: ADMIN, body: { code: 'launch-2026', grants: ['pack.fame'], maxUses: 2, days: 7, note: 'friends' } });
    expect(made.json.code).toBe('LAUNCH-2026');
    expect((await call(api, 'POST', '/admin/api/gifts', { bearer: ADMIN, body: { code: 'LAUNCH-2026', grants: ['pack.fame'] } })).status).toBe(409);
    const random = await call(api, 'POST', '/admin/api/gifts', { bearer: ADMIN, body: { grants: ['premium.no_ads'] } });
    expect(random.json.code).toMatch(/^GIFT-[2-9A-Z]{8}$/);

    const a = newDevice();
    const b = newDevice();
    const c = newDevice();
    const r1 = await call(api, 'POST', '/v1/redeem', { device: a, body: { code: 'Launch-2026' } });
    expect(r1.json).toMatchObject({ grants: ['pack.fame'], added: ['pack.fame'], already: false });
    expect(r1.json.pin).toMatch(/^\d{6}$/); // redeeming registers the phone
    expect((await call(api, 'POST', '/v1/redeem', { device: a, body: { code: 'LAUNCH-2026' } })).json.already).toBe(true);
    expect((await call(api, 'POST', '/v1/redeem', { device: b, body: { code: 'LAUNCH-2026' } })).status).toBe(200);
    expect((await call(api, 'POST', '/v1/redeem', { device: c, body: { code: 'LAUNCH-2026' } })).status).toBe(410);
    expect((await call(api, 'POST', '/v1/redeem', { device: c, body: { code: 'NOPE-NOPE' } })).status).toBe(404);
    const gifts = (await call(api, 'GET', '/admin/api/gifts', { bearer: ADMIN })).json.gifts;
    expect(gifts.find((g: any) => g.code === 'LAUNCH-2026')).toMatchObject({ uses: 2, maxUses: 2, note: 'friends' });

    clock.now += 8 * 86_400_000;
    expect((await call(api, 'POST', '/v1/redeem', { device: c, body: { code: random.json.code } })).status).toBe(200);
    await call(api, 'POST', '/admin/api/gifts', { bearer: ADMIN, body: { code: 'SHORT-ONE', grants: ['pack.boss'], maxUses: 10, days: 1 } });
    clock.now += 2 * 86_400_000;
    expect((await call(api, 'POST', '/v1/redeem', { device: c, body: { code: 'SHORT-ONE' } })).status).toBe(404);
    expect((await call(api, 'DELETE', '/admin/api/gifts/SHORT-ONE', { bearer: ADMIN })).status).toBe(200);
  });

  it('gifts redeemed on a new phone follow it into a restored family', async () => {
    const { api, store } = setup();
    const oldPhone = newDevice();
    const { code, pin } = (await call(api, 'POST', '/v1/save', { device: oldPhone, body: { enc: 'json', data: '{}' } })).json;
    await call(api, 'POST', '/admin/api/gifts', { bearer: ADMIN, body: { code: 'WELCOME', grants: ['theme.coal'], maxUses: 5 } });
    const newPhone = newDevice();
    await call(api, 'POST', '/v1/redeem', { device: newPhone, body: { code: 'WELCOME' } });
    const r = await call(api, 'POST', '/v1/restore', { device: newPhone, body: { code, pin } });
    expect(r.json.grants).toEqual(['theme.coal']);
    expect(store.players.has(newPhone[0])).toBe(false);
  });

  it('caps redeem attempts per IP', async () => {
    const { api } = setup();
    const dev = newDevice();
    let last = 0;
    for (let i = 0; i <= LIMITS.redeemPerHour; i++) last = (await call(api, 'POST', '/v1/redeem', { device: dev, body: { code: `GUESS-${i}0` } })).status;
    expect(last).toBe(429);
  });
});

describe('cloud: CORS and housekeeping', () => {
  it('answers the app origins only', async () => {
    const { api } = setup();
    const pre = await call(api, 'OPTIONS', '/v1/save', { origin: 'capacitor://localhost' });
    expect(pre.status).toBe(204);
    expect(pre.headers['Access-Control-Allow-Origin']).toBe('capacitor://localhost');
    expect(pre.headers['Access-Control-Allow-Headers']).toContain('Authorization');
    const evil = await call(api, 'POST', '/v1/hello', { origin: 'https://evil.example', device: newDevice() });
    expect(evil.status).toBe(403);
    expect(evil.headers['Access-Control-Allow-Origin']).toBeUndefined();
    const custom = setup({ ...ENV, ALLOWED_ORIGINS: 'https://heirloom.example' }).api;
    expect((await call(custom, 'GET', '/v1/health', { origin: 'https://heirloom.example' })).headers['Access-Control-Allow-Origin']).toBe('https://heirloom.example');
    expect((await call(custom, 'GET', '/v1/health', { origin: 'capacitor://localhost' })).status).toBe(403);
    // the admin API never answers cross-origin
    expect((await call(api, 'GET', '/admin/api/stats', { bearer: ADMIN, origin: 'capacitor://localhost' })).headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('cleans up old boards, forgotten families and spent counters', async () => {
    const { api, store, clock } = setup();
    const gone = newDevice();
    const kept = newDevice();
    await call(api, 'POST', '/v1/save', { device: gone, body: { enc: 'json', data: '{}' } });
    await call(api, 'POST', '/v1/daily', { device: gone, body: { date: TODAY, scores: scoresFor(TODAY) } });
    clock.now += (LIMITS.playerKeepDays - 10) * 86_400_000;
    await call(api, 'POST', '/v1/hello', { device: kept });
    clock.now += 20 * 86_400_000;
    await api.cleanup();
    expect(store.players.has(gone[0])).toBe(false);
    expect(store.saves.size).toBe(0);
    expect(store.daily.size).toBe(0);
    expect(store.players.has(kept[0])).toBe(true);
    expect(store.rate.size).toBe(0);
  });
});
