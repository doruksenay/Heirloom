// The opt-in cloud: family-code saves, the Daily leaderboard and gift codes (server: ../../server).
//
// - Hidden and silent while CLOUD_URL in config.ts is empty.
// - Nothing is sent until the player turns on "Cloud save" or "Daily leaderboard" in Settings, or types a gift code.
// - Identity is a random install id plus a secret made on this phone; no account, no names, no contact details.
// - Every call has a timeout and one quiet retry; offline just means "not now".
import type { CloudProfile, DailyResult, GameState, Profile } from '../engine/types';
import { CLOUD_URL } from './config';
import { PRODUCTS, expandEntitlements } from './purchases';
import { replaceAll } from './storage';

/** CLOUD_URL, or VITE_CLOUD_URL for a local dev run (`VITE_CLOUD_URL=http://127.0.0.1:8787 npm run dev`). */
function configuredUrl(): string {
  let dev = '';
  try {
    dev = (import.meta.env?.VITE_CLOUD_URL as string | undefined) ?? '';
  } catch {
    /* not under Vite */
  }
  return (CLOUD_URL || dev).replace(/\/+$/, '');
}
let baseUrl = configuredUrl();
/** For tests and local `wrangler dev` runs. */
export const setCloudUrl = (url: string) => {
  baseUrl = url.replace(/\/+$/, '');
};
export const cloudConfigured = () => baseUrl !== '';

/** Upload the family again after this many in-game years. */
export const SYNC_EVERY_YEARS = 5;
const TIMEOUT_MS = 10_000;
const MIN_GAP_MS = 20_000;

export type CloudError = 'offline' | 'auth' | 'wrong' | 'invalid' | 'used' | 'slow' | 'size' | 'server';
export type CloudResult<T> = { ok: true; data: T } | { ok: false; error: CloudError };

function errorFor(status: number): CloudError {
  if (status === 401) return 'auth';
  if (status === 403) return 'wrong';
  if (status === 404 || status === 400 || status === 422) return 'invalid';
  if (status === 410) return 'used';
  if (status === 413) return 'size';
  if (status === 429) return 'slow';
  return 'server';
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch with a timeout and a quiet retry on network errors and 5xx (never on 4xx). */
export async function request<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  opts: { body?: unknown; cloud?: CloudProfile; retries?: number; keepalive?: boolean; timeout?: number } = {},
): Promise<CloudResult<T>> {
  if (!baseUrl) return { ok: false, error: 'offline' };
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.cloud?.id && opts.cloud.secret) headers.Authorization = `Device ${opts.cloud.id}.${opts.cloud.secret}`;
  const body = opts.body === undefined ? undefined : JSON.stringify(opts.body);
  const retries = opts.retries ?? 1;
  let last: CloudError = 'offline';
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await wait(800 * attempt);
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl?.abort(), opts.timeout ?? TIMEOUT_MS);
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body,
        signal: ctrl?.signal,
        // a background sync may outlive the page; browsers cap keepalive bodies at 64 KB
        keepalive: opts.keepalive && (body?.length ?? 0) < 60_000,
      });
      if (res.ok) return { ok: true, data: (await res.json()) as T };
      last = errorFor(res.status);
      if (res.status < 500) return { ok: false, error: last };
    } catch {
      last = 'offline';
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, error: last };
}

// ---------- identity ----------

function randomUrlSafe(bytes: number): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A new install id (22 characters) and secret (43 characters). */
export const newIdentity = () => ({ id: randomUrlSafe(16), secret: randomUrlSafe(32) });

// ---------- save packing ----------

export interface CloudPayload {
  v: 1;
  family: GameState | null;
  daily: GameState | null;
  /** The profile without its cloud part (the secret never leaves the phone inside a save). */
  profile: Profile;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** gzip + base64 when the WebView can (iOS 16.4+, Android Chrome 80+), plain JSON otherwise. */
export async function packSave(payload: CloudPayload): Promise<{ enc: 'gzip64' | 'json'; data: string }> {
  const json = JSON.stringify(payload);
  if (typeof CompressionStream !== 'undefined') {
    try {
      return { enc: 'gzip64', data: toBase64(await pipe(new TextEncoder().encode(json), new CompressionStream('gzip'))) };
    } catch {
      /* fall back to plain JSON */
    }
  }
  return { enc: 'json', data: json };
}

export async function unpackSave(enc: string, data: string): Promise<CloudPayload> {
  const json = enc === 'gzip64' ? new TextDecoder().decode(await pipe(fromBase64(data), new DecompressionStream('gzip'))) : data;
  return JSON.parse(json) as CloudPayload;
}

/** The profile as it goes into a save: no cloud identity, and no entitlements that only the cloud granted. */
const withoutCloud = (p: Profile): Profile => {
  const { cloud, ...rest } = p;
  const added = cloud?.added ?? [];
  return { ...rest, entitlements: rest.entitlements.filter((e) => !added.includes(e)) };
};

// ---------- server grants ----------

const KNOWN = new Set(PRODUCTS.map((p) => p.id));

/**
 * Merges the server's grants into the profile. Grants are a bonus layer: they add entitlements, and when the admin
 * takes one back only what the cloud itself added is removed (a purchase of the same thing stays).
 */
export function applyGrants(profile: Profile, grants: string[]): Profile {
  const cloud = profile.cloud ?? {};
  const wanted = expandEntitlements(grants.filter((g) => KNOWN.has(g)));
  const before = cloud.added ?? [];
  const entitlements = profile.entitlements.filter((e) => !(before.includes(e) && !wanted.includes(e)));
  const added = before.filter((e) => wanted.includes(e));
  for (const e of wanted) {
    if (!entitlements.includes(e)) {
      entitlements.push(e);
      if (!added.includes(e)) added.push(e);
    }
  }
  return { ...profile, entitlements, cloud: { ...cloud, grants: [...grants], added } };
}

// ---------- Daily ranks ----------

export interface Board {
  date: string;
  n: number;
  categories: string[];
  values: Record<string, number[]>;
  top: { name: string | null; tag: string; score: number; scores: Record<string, number> }[];
}

/** "You beat X% of players" per category from the board's sorted values (which may already include you). */
export function rankFrom(board: Board, scores: Record<string, number>): { pct: Record<string, number>; n: number } {
  const pct: Record<string, number> = {};
  for (const c of board.categories) {
    const vals = board.values[c] ?? [];
    const v = scores[c];
    if (typeof v !== 'number' || vals.length === 0) continue;
    const lt = vals.filter((x) => x < v).length;
    const eq = vals.filter((x) => x === v).length;
    const others = eq > 0 ? vals.length - 1 : vals.length;
    if (others <= 0) continue;
    const share = (lt + Math.max(0, eq - 1) / 2) / others;
    pct[c] = Math.max(0, Math.min(100, Math.round(share * 100)));
  }
  return { pct, n: Math.max(board.n, 1) };
}

/** The public tag the server shows for this phone on the board (so the app can mark "you"). */
export async function myTag(id: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`tag:${id}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 6);
}

// ---------- the sync engine ----------

export interface CloudHost {
  family: GameState | null;
  daily: GameState | null;
  profile: Profile;
  updateProfile(fn: (p: Profile) => Profile): void;
}

let getHost: (() => CloudHost | null) | null = null;
let inFlight = false;
let lastYear: number | null = null;
let lastTry = 0;

/** The last profile this module wrote, until the app has re-rendered with it. */
let latest: { from: Profile; value: Profile } | null = null;

/**
 * The app, seen through a guard: the app's updateProfile works on the profile of its last render, so two updates in
 * a row (a new identity, then a reply) would undo each other. Here every update starts from the newest value.
 */
function host(): CloudHost | null {
  const raw = getHost?.() ?? null;
  if (!raw) return null;
  const current = () => (latest && latest.from === raw.profile ? latest.value : raw.profile);
  return {
    family: raw.family,
    daily: raw.daily,
    get profile() {
      return current();
    },
    updateProfile(fn) {
      const value = fn(current());
      latest = { from: raw.profile, value };
      raw.updateProfile(() => value);
    },
  };
}
const cloudOf = (h: CloudHost) => h.profile.cloud ?? {};
const patchCloud = (h: CloudHost, patch: Partial<CloudProfile>) => h.updateProfile((p) => ({ ...p, cloud: { ...(p.cloud ?? {}), ...patch } }));

/**
 * Makes sure this phone has an install id and secret, saving them before any call uses them. A phone whose family
 * moved to another phone starts over with a new identity (and a new family code).
 */
function identity(h: CloudHost): CloudProfile {
  const c = cloudOf(h);
  if (c.id && c.secret && !c.moved) return c;
  const fresh: Partial<CloudProfile> = { ...newIdentity(), moved: false, code: undefined, pin: undefined, syncedAt: undefined };
  patchCloud(h, fresh);
  return { ...c, ...fresh };
}

const meta = (h: CloudHost) => ({
  generation: h.family?.dynasty.generation ?? 0,
  packs: h.profile.entitlements.filter((e) => KNOWN.has(e) && !(cloudOf(h).added ?? []).includes(e)),
  nickname: cloudOf(h).nickname ?? '',
});

interface SaveReply {
  code: string;
  pin?: string;
  grants: string[];
  savedAt?: number | null;
}

function afterReply(h: CloudHost, r: SaveReply, extra: Partial<CloudProfile> = {}) {
  h.updateProfile((p) => applyGrants({ ...p, cloud: { ...(p.cloud ?? {}), code: r.code, pin: r.pin ?? p.cloud?.pin, ...extra } }, r.grants ?? []));
}

function onAuthError(h: CloudHost) {
  // the family was restored on another phone (or deleted): stop syncing from this one
  patchCloud(h, { moved: true });
}

/** Lets screens reach the app at once (child effects run before the app's own effects). */
export function bindCloudHost(get: () => CloudHost | null): void {
  getHost = get;
}

/**
 * Starts the cloud for the app: syncs when the app goes to the background, and fetches server grants once on
 * start. Returns a stop function. Does nothing while the cloud is not configured.
 */
export function startCloudSync(get: () => CloudHost | null): () => void {
  getHost = get;
  if (!cloudConfigured() || typeof document === 'undefined') return () => {};
  const onHide = () => {
    if (document.visibilityState === 'hidden') void syncNow({ background: true });
  };
  document.addEventListener('visibilitychange', onHide);
  const t = setTimeout(() => void hello(), 2500);
  return () => {
    document.removeEventListener('visibilitychange', onHide);
    clearTimeout(t);
  };
}

/** Call after every change: uploads the family every SYNC_EVERY_YEARS in-game years. */
export function cloudTick(): void {
  const h = host();
  if (!h || !cloudConfigured() || !h.profile.cloud?.on || !h.family) return;
  const year = h.family.year;
  if (lastYear === null || year < lastYear) {
    lastYear = year;
    return;
  }
  if (year - lastYear >= SYNC_EVERY_YEARS) {
    lastYear = year;
    void syncNow();
  }
}

/** On start: picks up grants given by the admin since last time (only for phones already known to the server). */
export async function hello(): Promise<boolean> {
  const h = host();
  const c = h ? cloudOf(h) : null;
  if (!h || !c?.id || !c.secret || c.moved || !cloudConfigured()) return false;
  const r = await request<SaveReply>('POST', '/v1/hello', { cloud: c, body: meta(h) });
  if (r.ok) afterReply(h, r.data);
  else if (r.error === 'auth') onAuthError(h);
  return r.ok;
}

/** Uploads the family, today's Daily life and the profile. Quietly does nothing when off, offline or busy. */
export async function syncNow(opts: { force?: boolean; background?: boolean } = {}): Promise<CloudResult<SaveReply>> {
  const h = host();
  if (!h || !cloudConfigured() || !h.profile.cloud?.on || h.profile.cloud.moved) return { ok: false, error: 'offline' };
  if (inFlight || (!opts.force && Date.now() - lastTry < MIN_GAP_MS)) return { ok: false, error: 'slow' };
  inFlight = true;
  lastTry = Date.now();
  try {
    const c = identity(h);
    const packed = await packSave({ v: 1, family: h.family, daily: h.daily, profile: withoutCloud(h.profile) });
    const r = await request<SaveReply>('POST', '/v1/save', { cloud: c, body: { ...packed, ...meta(h) }, keepalive: opts.background, retries: opts.background ? 0 : 1 });
    const now = host() ?? h;
    if (r.ok) {
      afterReply(now, r.data, { syncedAt: Date.now() });
      // a phone first registered by the leaderboard or a gift code never saw its PIN: make one it can show
      if (!(host() ?? now).profile.cloud?.pin) await newPin();
    } else if (r.error === 'auth') onAuthError(now);
    return r;
  } finally {
    inFlight = false;
  }
}

/**
 * Turns cloud save on (and uploads right away) or off. Turning it off keeps what is online until deleted. Turning it
 * on after the family moved to another phone starts a new cloud save with a new family code.
 */
export async function setCloudSave(on: boolean): Promise<CloudResult<SaveReply> | null> {
  const h = host();
  if (!h) return null;
  patchCloud(h, { on });
  if (!on) return null;
  const c = cloudOf(host() ?? h);
  if (c.moved) identity(host() ?? h);
  return syncNow({ force: true });
}

/** A new PIN for the family code (the old one stops working). */
export async function newPin(): Promise<CloudResult<{ code: string; pin: string }>> {
  const h = host();
  const c = h ? cloudOf(h) : null;
  if (!h || !c?.id) return { ok: false, error: 'auth' };
  const r = await request<{ code: string; pin: string }>('POST', '/v1/pin', { cloud: c, retries: 0 });
  if (r.ok) patchCloud(h, { code: r.data.code, pin: r.data.pin });
  else if (r.error === 'auth') onAuthError(h);
  return r;
}

/**
 * Brings a family from another phone: replaces the saves on this one and reloads the app. Purchases made on this
 * phone stay; the cloud identity becomes the family's.
 */
export async function restoreFamily(code: string, pin: string, reload = () => location.reload()): Promise<CloudResult<null>> {
  const h = host();
  if (!h) return { ok: false, error: 'offline' };
  const c = cloudOf(h);
  const r = await request<{ id: string; secret: string; code: string; grants: string[]; save: { enc: string; data: string } | null }>('POST', '/v1/restore', {
    cloud: c.id && !c.moved ? c : undefined,
    body: { code, pin: pin.trim() },
    retries: 0,
  });
  if (!r.ok) return r;
  let payload: CloudPayload | null = null;
  try {
    payload = r.data.save ? await unpackSave(r.data.save.enc, r.data.save.data) : null;
  } catch {
    return { ok: false, error: 'server' };
  }
  const base: Profile = payload?.profile ? { ...h.profile, ...payload.profile, settings: { ...h.profile.settings, ...payload.profile.settings } } : h.profile;
  const merged: Profile = {
    ...base,
    entitlements: [...new Set([...h.profile.entitlements.filter((e) => !(c.added ?? []).includes(e)), ...(payload?.profile.entitlements ?? [])])],
    cloud: { on: true, board: c.board, nickname: c.nickname, id: r.data.id, secret: r.data.secret, code: r.data.code, pin: pin.trim(), syncedAt: Date.now(), ranks: c.ranks },
  };
  const profile = applyGrants(merged, r.data.grants ?? []);
  await replaceAll(payload?.family ?? h.family, payload?.daily ?? null, { ...profile, entitlements: expandEntitlements(profile.entitlements) });
  reload();
  return { ok: true, data: null };
}

/** Deletes everything the server has for this phone (Apple requires in-app deletion). Local saves stay. */
export async function deleteCloudData(): Promise<CloudResult<{ deleted: boolean }>> {
  const h = host();
  if (!h) return { ok: false, error: 'offline' };
  const c = cloudOf(h);
  const done = () => h.updateProfile((p) => ({ ...p, cloud: { ranks: p.cloud?.ranks } }));
  if (!c.id) {
    done();
    return { ok: true, data: { deleted: true } };
  }
  const r = await request<{ deleted: boolean }>('DELETE', '/v1/me', { cloud: c });
  // 'auth' means the server no longer knows this phone: nothing left to delete
  if (r.ok || r.error === 'auth') {
    done();
    return { ok: true, data: { deleted: true } };
  }
  return r;
}

/** Redeems a gift code; its entitlements are merged into the profile at once. */
export async function redeemGift(code: string): Promise<CloudResult<{ added: string[]; already: boolean }>> {
  const h = host();
  if (!h || !cloudConfigured()) return { ok: false, error: 'offline' };
  const c = identity(h);
  const r = await request<SaveReply & { added: string[]; already: boolean }>('POST', '/v1/redeem', { cloud: c, body: { code: code.trim() }, retries: 0 });
  if (!r.ok) return r;
  afterReply(host() ?? h, r.data);
  return { ok: true, data: { added: r.data.added, already: r.data.already } };
}

export async function fetchBoard(date: string): Promise<Board | null> {
  if (!cloudConfigured()) return null;
  const r = await request<Board>('GET', `/v1/daily/${date}`);
  return r.ok ? r.data : null;
}

/** Sends a finished Daily result (first try only, once) and stores "you beat X%" for each category. */
export async function submitDaily(result: DailyResult): Promise<{ pct: Record<string, number>; n: number } | null> {
  const h = host();
  if (!h || !cloudConfigured() || !h.profile.cloud?.board) return null;
  // the first try is sent once; later views only refresh the percentages
  if (!h.profile.cloud.ranks?.[result.date]) {
    const c = identity(h);
    const sent = await request<SaveReply>('POST', '/v1/daily', { cloud: c, body: { date: result.date, scores: result.scores, ...meta(h) } });
    if (sent.ok) afterReply(host() ?? h, sent.data);
    else if (sent.error !== 'invalid') return null;
  }
  const board = await fetchBoard(result.date);
  if (!board) return null;
  const rank = rankFrom(board, result.scores);
  const now = host() ?? h;
  now.updateProfile((p) => {
    const ranks = { ...(p.cloud?.ranks ?? {}), [result.date]: rank };
    const keep = Object.keys(ranks).sort().slice(-30);
    return { ...p, cloud: { ...(p.cloud ?? {}), ranks: Object.fromEntries(keep.map((d) => [d, ranks[d]])) } };
  });
  return rank;
}

/** Turns the Daily leaderboard on or off; turning it on sends today's result if there is one. */
export function setBoard(on: boolean) {
  const h = host();
  if (h) patchCloud(h, { board: on });
}

export function setNickname(name: string) {
  const h = host();
  if (h) patchCloud(h, { nickname: name.replace(/\s+/g, ' ').trim().slice(0, 16) || undefined });
}

/** For tests: forget module state between cases. */
export function resetCloudForTests() {
  getHost = null;
  latest = null;
  inFlight = false;
  lastYear = null;
  lastTry = 0;
}
