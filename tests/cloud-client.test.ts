// The app's cloud client (src/platform/cloud.ts) end to end: fetch is routed into the server logic with an in-memory store.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Api } from '../server/src/logic';
import { MemoryStore } from '../server/src/store';
import { planCategories } from '../server/src/plan';
import type { GameState, Profile } from '../src/engine/types';
import { newGame, ageUp, choose } from '../src/engine/game';

const ADMIN = 'admin-token-for-tests-0123456789';
let store: MemoryStore;
let api: Api;
let online = true;
const calls: string[] = [];

const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
  if (!online) throw new TypeError('Failed to fetch');
  const u = new URL(url);
  calls.push(`${init.method ?? 'GET'} ${u.pathname}`);
  const headers = new Headers(init.headers);
  const res = await api.handle({
    method: init.method ?? 'GET',
    path: u.pathname,
    query: u.searchParams,
    header: (n) => headers.get(n),
    ip: '203.0.113.9',
    body: typeof init.body === 'string' ? init.body : '',
  });
  return new Response(res.status === 204 ? null : res.body, { status: res.status, headers: res.headers });
});
vi.stubGlobal('fetch', fetchMock);
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
});

const cloud = await import('../src/platform/cloud');
const storage = await import('../src/platform/storage');

const baseProfile = (): Profile => ({ entitlements: [], settings: { themeId: 'evening', language: 'tr', adultContent: false, sound: true } });

/** A stand-in for the app: holds the saves and profile, applies updates at once. */
function makeHost(family: GameState | null = null, profile = baseProfile()) {
  const h = {
    family,
    daily: null as GameState | null,
    profile,
    updateProfile(fn: (p: Profile) => Profile) {
      h.profile = fn(h.profile);
    },
  };
  cloud.startCloudSync(() => h);
  return h;
}

function family(years = 12): GameState {
  const s = newGame({ firstName: 'Ada', lastName: 'Yılmaz', gender: 'female', countryId: 'tr', city: 'İzmir', seed: 42 }, baseProfile());
  for (let i = 0; i < years && !s.dead; i++) {
    while (s.pending) choose(s, s.pending.choices.find((c) => !c.disabled)!.id);
    ageUp(s);
  }
  return s;
}

beforeEach(() => {
  mem.clear();
  store = new MemoryStore();
  api = new Api(store, { PEPPER: 'pepper-for-tests-0123456789abcdef', ADMIN_TOKEN: ADMIN });
  online = true;
  calls.length = 0;
  fetchMock.mockClear();
  cloud.resetCloudForTests();
  cloud.setCloudUrl('https://cloud.test');
});
afterEach(() => cloud.resetCloudForTests());

describe('cloud client: hidden and silent by default', () => {
  it('sends nothing while CLOUD_URL is empty or before consent', async () => {
    cloud.setCloudUrl('');
    expect(cloud.cloudConfigured()).toBe(false);
    const h = makeHost(family());
    expect((await cloud.syncNow({ force: true })).ok).toBe(false);
    expect(await cloud.submitDaily({ date: '2026-10-29', scores: {}, medals: {} })).toBeNull();
    expect(await cloud.fetchBoard('2026-10-29')).toBeNull();
    cloud.setCloudUrl('https://cloud.test');
    h.family!.year += 20;
    cloud.cloudTick();
    expect((await cloud.syncNow({ force: true })).ok).toBe(false); // configured, but no consent
    expect(await cloud.hello()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(h.profile.cloud).toBeUndefined();
  });

  it('the shipped config keeps the cloud off', async () => {
    const { CLOUD_URL } = await import('../src/platform/config');
    expect(CLOUD_URL).toBe('');
  });

  it('copes with being offline', async () => {
    const h = makeHost(family());
    h.profile = { ...h.profile, cloud: { on: true } };
    online = false;
    const r = await cloud.syncNow({ force: true });
    expect(r).toEqual({ ok: false, error: 'offline' });
    expect(fetchMock).toHaveBeenCalledTimes(2); // one quiet retry
    expect(h.profile.cloud?.on).toBe(true);
  });
});

describe('cloud client: family code', () => {
  it('packs saves small and unpacks them intact', async () => {
    const f = family(70);
    const packed = await cloud.packSave({ v: 1, family: f, daily: null, profile: baseProfile() });
    expect(packed.enc).toBe('gzip64');
    expect(packed.data.length).toBeLessThan(JSON.stringify(f).length / 1.5);
    const back = await cloud.unpackSave(packed.enc, packed.data);
    expect(back.family).toEqual(JSON.parse(JSON.stringify(f)));
    console.log(`save: ${JSON.stringify(f).length} chars of JSON -> ${packed.data.length} chars packed`);
  });

  it('opts in, uploads, and moves the family to a new phone', async () => {
    const f = family();
    const old = makeHost(f, { ...baseProfile(), entitlements: ['pack.fame'] });
    const r = await cloud.setCloudSave(true);
    expect(r?.ok).toBe(true);
    const c = old.profile.cloud!;
    expect(c.on).toBe(true);
    expect(c.code).toMatch(/^HLM-/);
    expect(c.pin).toMatch(/^\d{6}$/);
    expect(c.id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(c.syncedAt).toBeGreaterThan(0);
    const row = store.players.get(c.id!)!;
    expect(row.generation).toBe(1);
    expect(JSON.parse(row.packs)).toEqual(['pack.fame']);
    // the secret never travels inside the save
    const saved = await cloud.unpackSave(store.saves.get(c.id!)!.enc, store.saves.get(c.id!)!.data);
    expect(saved.profile.cloud).toBeUndefined();
    expect(JSON.stringify(saved)).not.toContain(c.secret!);

    // a brand-new phone
    cloud.resetCloudForTests();
    const fresh = makeHost(null, { ...baseProfile(), entitlements: ['theme.coal'] });
    let reloaded = false;
    const res = await cloud.restoreFamily(c.code!.toLowerCase(), c.pin!, () => (reloaded = true));
    expect(res.ok).toBe(true);
    expect(reloaded).toBe(true);
    void fresh;
    // what the app loads after the reload
    expect(storage.loadGame()).toEqual(JSON.parse(JSON.stringify(f)));
    expect(storage.loadMode()).toBe('family');
    const p = storage.loadProfile();
    expect(p.entitlements.sort()).toEqual(['pack.fame', 'theme.coal']); // purchases from both phones
    expect(p.cloud).toMatchObject({ on: true, id: c.id, code: c.code, pin: c.pin });
    expect(p.cloud?.secret).not.toBe(c.secret); // a new secret for the new phone

    // the old phone learns that the family moved
    cloud.resetCloudForTests();
    cloud.startCloudSync(() => old);
    const after = await cloud.syncNow({ force: true });
    expect(after).toEqual({ ok: false, error: 'auth' });
    expect(old.profile.cloud?.moved).toBe(true);
    // turning it on again starts a new family code here
    const again = await cloud.setCloudSave(true);
    expect(again?.ok).toBe(true);
    expect(old.profile.cloud?.code).not.toBe(c.code);
    expect(old.profile.cloud?.moved).toBe(false);
  });

  it('deletes everything on the server and forgets the identity', async () => {
    const h = makeHost(family());
    await cloud.setCloudSave(true);
    expect(store.players.size).toBe(1);
    const r = await cloud.deleteCloudData();
    expect(r.ok).toBe(true);
    expect(store.players.size + store.saves.size).toBe(0);
    expect(h.profile.cloud?.id).toBeUndefined();
    expect(h.profile.cloud?.on).toBeUndefined();
  });

  it('syncs again only after enough in-game years', async () => {
    const h = makeHost(family());
    await cloud.setCloudSave(true);
    const saves = () => calls.filter((c) => c === 'POST /v1/save').length;
    expect(saves()).toBe(1);
    cloud.cloudTick(); // remembers the year
    h.family!.year += cloud.SYNC_EVERY_YEARS - 1;
    cloud.cloudTick();
    await new Promise((r) => setTimeout(r, 0));
    expect(saves()).toBe(1);
    h.family!.year += 1;
    vi.useFakeTimers({ now: Date.now() + 60_000 });
    try {
      cloud.cloudTick();
    } finally {
      vi.useRealTimers();
    }
    await vi.waitFor(() => expect(saves()).toBe(2));
  });
});

describe('cloud client: grants and gift codes', () => {
  it('merges grants and takes back only what the cloud added', () => {
    let p: Profile = { ...baseProfile(), entitlements: ['pack.fame'] };
    p = cloud.applyGrants(p, ['bundle.all', 'premium.no_ads', 'not.a.product']);
    expect(p.entitlements.sort()).toEqual(['bundle.all', 'pack.boss', 'pack.campus', 'pack.crime_world', 'pack.fame', 'premium.no_ads'].sort());
    expect(p.cloud?.added).not.toContain('pack.fame'); // bought, not granted
    p = cloud.applyGrants(p, ['premium.no_ads']);
    expect(p.entitlements.sort()).toEqual(['pack.fame', 'premium.no_ads']);
    p = cloud.applyGrants(p, []);
    expect(p.entitlements).toEqual(['pack.fame']);
  });

  it('redeems a gift code and picks up admin grants on hello', async () => {
    await api.handle({
      method: 'POST',
      path: '/admin/api/gifts',
      query: new URLSearchParams(),
      header: (n) => (n === 'Authorization' ? `Bearer ${ADMIN}` : null),
      ip: '1',
      body: JSON.stringify({ code: 'HOSGELDIN', grants: ['pack.campus'], maxUses: 10 }),
    });
    const h = makeHost();
    expect((await cloud.redeemGift('bad')).ok).toBe(false);
    const r = await cloud.redeemGift(' hosgeldin ');
    expect(r).toEqual({ ok: true, data: { added: ['pack.campus'], already: false } });
    expect(h.profile.entitlements).toContain('pack.campus');
    expect(h.profile.cloud?.code).toMatch(/^HLM-/);
    // the admin adds Heirloom+
    const id = h.profile.cloud!.id!;
    await api.handle({
      method: 'POST',
      path: `/admin/api/players/${id}`,
      query: new URLSearchParams(),
      header: (n) => (n === 'Authorization' ? `Bearer ${ADMIN}` : null),
      ip: '1',
      body: JSON.stringify({ grants: ['pack.campus', 'premium.no_ads'] }),
    });
    expect(await cloud.hello()).toBe(true);
    expect(h.profile.entitlements.sort()).toEqual(['pack.campus', 'premium.no_ads']);
  });
});

describe('cloud client: Daily leaderboard', () => {
  it('computes "better than X%"', () => {
    const board = { date: 'd', n: 5, categories: ['age'], values: { age: [60, 70, 80, 80, 90] }, top: [] };
    expect(cloud.rankFrom(board, { age: 90 }).pct.age).toBe(100);
    expect(cloud.rankFrom(board, { age: 60 }).pct.age).toBe(0);
    expect(cloud.rankFrom(board, { age: 80 }).pct.age).toBe(63); // 2 below + half of the other 80, of 4 others
    expect(cloud.rankFrom({ ...board, n: 1, values: { age: [70] } }, { age: 70 }).pct.age).toBeUndefined();
  });

  it('sends the first try once and stores the percentages', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const cats = planCategories(date);
    // other players first
    for (let i = 0; i < 9; i++) {
      await api.handle({
        method: 'POST',
        path: '/v1/daily',
        query: new URLSearchParams(),
        header: (n) => (n === 'Authorization' ? `Device other${i}abcdefghijklmnop.secret${i}abcdefghijklmnopqrstuvwxyz0123456` : null),
        ip: `10.0.0.${i}`,
        body: JSON.stringify({ date, scores: Object.fromEntries(cats.map((c) => [c, c === 'age' ? 60 + i : i])) }),
      });
    }
    const h = makeHost();
    h.profile = { ...h.profile, cloud: { board: true, nickname: 'Ada' } };
    const scores = Object.fromEntries(cats.map((c) => [c, c === 'age' ? 99 : 1_000]));
    const r = await cloud.submitDaily({ date, scores, medals: {} });
    expect(r?.n).toBe(10);
    for (const c of cats) expect(r?.pct[c]).toBe(100);
    expect(h.profile.cloud?.ranks?.[date]?.pct).toEqual(r?.pct);
    // the leaderboard registered the phone: it already has a family code and PIN for a later cloud save
    expect(h.profile.cloud?.code).toMatch(/^HLM-/);
    expect(h.profile.cloud?.pin).toMatch(/^\d{6}$/);
    expect(store.daily.size).toBe(10);
    const board = await cloud.fetchBoard(date);
    expect(board?.top[0].name).toBe('Ada');
    expect(board?.top[0].tag).toBe(await cloud.myTag(h.profile.cloud!.id!));
    // viewing the result again only refreshes
    calls.length = 0;
    await cloud.submitDaily({ date, scores, medals: {} });
    expect(calls).toEqual([`GET /v1/daily/${date}`]);
    // turning on cloud save later keeps the same code, and the PIN works
    const code = h.profile.cloud!.code!;
    const pin = h.profile.cloud!.pin!;
    expect((await cloud.setCloudSave(true))?.ok).toBe(true);
    expect(h.profile.cloud?.code).toBe(code);
    const res = await api.handle({ method: 'POST', path: '/v1/restore', query: new URLSearchParams(), header: () => null, ip: '10.9.9.9', body: JSON.stringify({ code, pin }) });
    expect(res.status).toBe(200);
  });
});
