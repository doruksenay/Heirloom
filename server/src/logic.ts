// The Heirloom cloud API: family-code saves, the Daily leaderboard, gift codes and the admin API.
// Everything here talks to a Store and plain request/response objects, so it runs under vitest with MemoryStore;
// index.ts turns Cloudflare's Request/Response and D1 into these.
import { hmac, newFamilyCode, newPin, normalizeFamilyCode, normalizeGiftCode, randomString, safeEqual, sha256 } from './crypto';
import { checkScores, isDateKey, planCategories } from './plan';
import { GRANT_LABELS, GRANTABLE, isGrantable } from './products';
import type { DailyRow, GiftRow, PlayerRow, Store } from './store';
import { adminPage } from './admin-page';

export interface Env {
  /** Secret used to hash PINs and IP addresses. Required. */
  PEPPER?: string;
  /** Password for /admin. Without it (or shorter than 24 characters) the admin API is off. */
  ADMIN_TOKEN?: string;
  /** Comma-separated origins allowed to call /v1 from a browser (the app's WebView). */
  ALLOWED_ORIGINS?: string;
}

export interface ApiRequest {
  method: string;
  /** URL path, e.g. /v1/save */
  path: string;
  query: URLSearchParams;
  header(name: string): string | null;
  /** Client IP (CF-Connecting-IP). Only ever stored hashed, inside short-lived rate counters. */
  ip: string;
  body: string;
}

export interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/** Limits. A save is the gzip of the family, the Daily life and the profile; real ones are 10–60 KB. */
export const LIMITS = {
  saveChars: 1_000_000,
  bodyChars: 1_100_000,
  smallBody: 4_096,
  nickname: 16,
  /** Per hashed IP. Generous, because many phones can share one mobile-network IP (CGNAT). */
  createPerDay: 200,
  restorePerHour: 30,
  redeemPerHour: 30,
  dailyPerDay: 300,
  adminFailsPerHour: 10,
  /** Per family code, whoever is trying. */
  restorePerCodePerHour: 6,
  /** Per player. */
  savesPerHour: 40,
  pinPerHour: 5,
  /** Daily entries are kept this long, players this long after they were last seen. */
  dailyKeepDays: 90,
  playerKeepDays: 548,
};

export const DEFAULT_ORIGINS = ['capacitor://localhost', 'https://localhost', 'http://localhost', 'http://localhost:5173'];

const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
const SECRET_RE = /^[A-Za-z0-9_-]{32,128}$/;
const B64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const DAY = 86_400_000;

const dateKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

function parseList(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Optional nickname for the leaderboard: letters, digits, spaces and . _ ' - only. undefined = not sent. */
export function cleanNickname(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') return null;
  const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, LIMITS.nickname).trim();
  if (!s) return null;
  return /^[\p{L}\p{N} ._'-]+$/u.test(s) ? s : null;
}

const cleanPacks = (raw: unknown): string[] | undefined =>
  Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && /^[a-z]+\.[a-z0-9_]{1,32}$/.test(x)).slice(0, 16) : undefined;

const cleanGeneration = (raw: unknown): number | undefined =>
  typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 100_000 ? raw : undefined;

/** Values below `v` count fully, equal values half: the share of other players this score beats. */
function beatShare(sorted: number[], v: number): number {
  if (sorted.length <= 1) return 1;
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (sorted[m] < v) lo = m + 1;
    else hi = m;
  }
  const lt = lo;
  let eq = 0;
  for (let i = lo; i < sorted.length && sorted[i] === v; i++) eq++;
  return (lt + Math.max(0, eq - 1) / 2) / (sorted.length - 1);
}

/** At most `max` evenly spaced values of a sorted list (all of them when it is short). */
function sample(sorted: number[], max = 200): number[] {
  if (sorted.length <= max) return sorted;
  const out: number[] = [];
  for (let i = 0; i < max; i++) out.push(sorted[Math.round((i * (sorted.length - 1)) / (max - 1))]);
  return out;
}

export interface Board {
  date: string;
  n: number;
  categories: string[];
  /** Sorted scores per category (every score up to 200 players, an even sample above that). */
  values: Record<string, number[]>;
  /** Best 20 by the average share of players beaten across the day's categories. */
  top: { name: string | null; tag: string; score: number; scores: Record<string, number> }[];
}

export class Api {
  private boards = new Map<string, { at: number; board: Board }>();
  private now: () => number;

  constructor(
    private store: Store,
    private env: Env,
    opts: { now?: () => number } = {},
  ) {
    this.now = opts.now ?? Date.now;
  }

  async handle(req: ApiRequest): Promise<ApiResponse> {
    let res: ApiResponse;
    try {
      res = await this.route(req);
    } catch (e) {
      if (e instanceof HttpError) res = this.json(e.status, { error: e.code });
      else {
        console.error(e);
        res = this.json(500, { error: 'server' });
      }
    }
    res.headers['X-Content-Type-Options'] = 'nosniff';
    res.headers['Referrer-Policy'] = 'no-referrer';
    res.headers['Cache-Control'] ??= 'no-store';
    if (req.path.startsWith('/v1/')) Object.assign(res.headers, this.cors(req));
    return res;
  }

  // ---------- plumbing ----------

  private json(status: number, body: unknown, headers: Record<string, string> = {}): ApiResponse {
    return { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }, body: JSON.stringify(body) };
  }

  private origins(): string[] {
    const list = (this.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return list.length ? list : DEFAULT_ORIGINS;
  }

  private cors(req: ApiRequest): Record<string, string> {
    const origin = req.header('Origin');
    if (!origin || !this.origins().includes(origin)) return { Vary: 'Origin' };
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
  }

  private parse(req: ApiRequest, max = LIMITS.smallBody): Record<string, unknown> {
    if (req.body.length > max) throw new HttpError(413, 'too large');
    if (!req.body) return {};
    try {
      const v = JSON.parse(req.body);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch {
      /* fall through */
    }
    throw new HttpError(400, 'bad json');
  }

  private pepper(): string {
    const p = this.env.PEPPER ?? '';
    if (p.length < 16) throw new HttpError(503, 'not configured');
    return p;
  }

  private async ipKey(req: ApiRequest): Promise<string> {
    return (await hmac(this.pepper(), `ip:${req.ip}`)).slice(0, 20);
  }

  private async limit(key: string, max: number, windowSec: number) {
    if ((await this.store.hit(key, windowSec, this.now())) > max) throw new HttpError(429, 'slow down');
  }

  private pinHash(code: string, pin: string) {
    return hmac(this.pepper(), `pin:${code}:${pin}`);
  }

  /**
   * The device behind `Authorization: Device <id>.<secret>`. Unknown ids are registered on the spot when `create`
   * is set (trust on first use): the app makes the id and secret itself, the server keeps only the secret's hash.
   */
  private async device(req: ApiRequest, create: boolean): Promise<{ player: PlayerRow; pin?: string }> {
    const m = /^Device ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(req.header('Authorization') ?? '');
    if (!m || !ID_RE.test(m[1]) || !SECRET_RE.test(m[2])) throw new HttpError(401, 'auth');
    const [, id, secret] = m;
    const hash = await sha256(secret);
    const found = await this.store.getPlayer(id);
    if (found) {
      if (!safeEqual(found.secret_hash, hash)) throw new HttpError(401, 'auth');
      return { player: found };
    }
    if (!create) throw new HttpError(401, 'auth');
    await this.limit(`create:${await this.ipKey(req)}`, LIMITS.createPerDay, 86_400);
    const now = this.now();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newFamilyCode();
      if (await this.store.getPlayerByCode(code)) continue;
      const pin = newPin();
      const player: PlayerRow = {
        id,
        secret_hash: hash,
        code,
        pin_hash: await this.pinHash(code, pin),
        nickname: null,
        grants: '[]',
        generation: 0,
        packs: '[]',
        created_at: now,
        last_seen: now,
        saved_at: null,
        save_size: 0,
      };
      await this.store.insertPlayer(player);
      return { player, pin };
    }
    throw new HttpError(500, 'server');
  }

  /** Nickname, generation and owned packs the app may send with any call. */
  private meta(body: Record<string, unknown>): Partial<PlayerRow> {
    const patch: Partial<PlayerRow> = { last_seen: this.now() };
    const nick = cleanNickname(body.nickname);
    if (nick !== undefined) patch.nickname = nick;
    const gen = cleanGeneration(body.generation);
    if (gen !== undefined) patch.generation = gen;
    const packs = cleanPacks(body.packs);
    if (packs) patch.packs = JSON.stringify(packs);
    return patch;
  }

  // ---------- routes ----------

  private async route(req: ApiRequest): Promise<ApiResponse> {
    const { method, path } = req;
    if (path.startsWith('/v1/')) {
      if (method === 'OPTIONS') return { status: 204, headers: {}, body: '' };
      const origin = req.header('Origin');
      if (origin && !this.origins().includes(origin)) throw new HttpError(403, 'origin');
      if (method === 'GET' && path === '/v1/health') return this.json(200, { ok: true });
      this.pepper();
      if (method === 'POST' && path === '/v1/hello') return this.hello(req);
      if (method === 'POST' && path === '/v1/save') return this.save(req);
      if (method === 'POST' && path === '/v1/restore') return this.restore(req);
      if (method === 'POST' && path === '/v1/pin') return this.newPinRoute(req);
      if (method === 'DELETE' && path === '/v1/me') return this.deleteMe(req);
      if (method === 'POST' && path === '/v1/redeem') return this.redeem(req);
      if (method === 'POST' && path === '/v1/daily') return this.dailyPost(req);
      const d = /^\/v1\/daily\/(\d{4}-\d{2}-\d{2})$/.exec(path);
      if (method === 'GET' && d) return this.dailyGet(d[1]);
      throw new HttpError(404, 'not found');
    }
    if (path === '/admin' || path === '/admin/') {
      if (method !== 'GET') throw new HttpError(405, 'method');
      const nonce = randomString(22, URL_ALPHABET);
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
          'X-Frame-Options': 'DENY',
        },
        body: adminPage(nonce, GRANTABLE, GRANT_LABELS),
      };
    }
    if (path.startsWith('/admin/api/')) return this.admin(req);
    if (path === '/') return { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Heirloom cloud' };
    throw new HttpError(404, 'not found');
  }

  private async grantsOf(p: PlayerRow) {
    return parseList(p.grants).filter(isGrantable);
  }

  /** Registers the device if new and reports its family code (and PIN the first time) and server grants. */
  private async hello(req: ApiRequest) {
    const body = this.parse(req);
    const { player, pin } = await this.device(req, true);
    await this.store.updatePlayer(player.id, this.meta(body));
    return this.json(200, { code: player.code, pin, grants: await this.grantsOf(player), savedAt: player.saved_at });
  }

  private async save(req: ApiRequest) {
    if (req.body.length > LIMITS.bodyChars) throw new HttpError(413, 'too large');
    const body = this.parse(req, LIMITS.bodyChars);
    const { enc, data } = body;
    if (enc !== 'gzip64' && enc !== 'json') throw new HttpError(400, 'enc');
    if (typeof data !== 'string' || !data) throw new HttpError(400, 'data');
    if (data.length > LIMITS.saveChars) throw new HttpError(413, 'too large');
    if (enc === 'gzip64' ? !B64_RE.test(data) : !data.startsWith('{')) throw new HttpError(400, 'data');
    const { player, pin } = await this.device(req, true);
    await this.limit(`save:${player.id}`, LIMITS.savesPerHour, 3600);
    const now = this.now();
    await this.store.putSave({ player_id: player.id, enc, data, updated_at: now });
    await this.store.updatePlayer(player.id, { ...this.meta(body), saved_at: now, save_size: data.length });
    return this.json(200, { code: player.code, pin, grants: await this.grantsOf(player), savedAt: now });
  }

  /**
   * A new phone asks for a family by code and PIN. The family keeps its id; the secret is replaced, so the old phone
   * stops syncing (it is told the family moved) and two phones never overwrite each other.
   */
  private async restore(req: ApiRequest) {
    const body = this.parse(req);
    const ip = await this.ipKey(req);
    await this.limit(`restore:${ip}`, LIMITS.restorePerHour, 3600);
    const code = normalizeFamilyCode(body.code);
    const pin = typeof body.pin === 'string' && /^\d{4,8}$/.test(body.pin) ? body.pin : null;
    if (!code || !pin) throw new HttpError(400, 'format');
    await this.limit(`restore-code:${code}`, LIMITS.restorePerCodePerHour, 3600);
    const player = await this.store.getPlayerByCode(code);
    if (!player || !safeEqual(player.pin_hash, await this.pinHash(code, pin))) throw new HttpError(403, 'wrong');

    // gifts the new phone had already redeemed under its own id follow it into the family
    let grants = await this.grantsOf(player);
    let current: PlayerRow | null = null;
    try {
      current = (await this.device(req, false)).player;
    } catch {
      current = null;
    }
    if (current && current.id !== player.id) {
      grants = [...new Set([...grants, ...(await this.grantsOf(current))])];
      await this.store.deletePlayer(current.id);
    }
    const secret = randomString(43, URL_ALPHABET);
    await this.store.updatePlayer(player.id, { secret_hash: await sha256(secret), grants: JSON.stringify(grants), last_seen: this.now() });
    const save = await this.store.getSave(player.id);
    return this.json(200, {
      id: player.id,
      secret,
      code: player.code,
      grants,
      save: save ? { enc: save.enc, data: save.data, savedAt: save.updated_at } : null,
    });
  }

  private async newPinRoute(req: ApiRequest) {
    const { player } = await this.device(req, false);
    await this.limit(`pin:${player.id}`, LIMITS.pinPerHour, 3600);
    const pin = newPin();
    await this.store.updatePlayer(player.id, { pin_hash: await this.pinHash(player.code, pin), last_seen: this.now() });
    return this.json(200, { code: player.code, pin });
  }

  private async deleteMe(req: ApiRequest) {
    const { player } = await this.device(req, false);
    await this.store.deletePlayer(player.id);
    this.boards.clear();
    return this.json(200, { deleted: true });
  }

  private async redeem(req: ApiRequest) {
    const body = this.parse(req);
    await this.limit(`redeem:${await this.ipKey(req)}`, LIMITS.redeemPerHour, 3600);
    const code = normalizeGiftCode(body.code);
    if (!code) throw new HttpError(404, 'invalid');
    const gift = await this.store.getGift(code);
    if (!gift || (gift.expires_at !== null && gift.expires_at < this.now())) throw new HttpError(404, 'invalid');
    const { player, pin } = await this.device(req, true);
    const outcome = await this.store.redeemGift(code, player.id, this.now());
    if (outcome === 'exhausted') throw new HttpError(410, 'used up');
    const added = parseList(gift.grants).filter(isGrantable);
    const grants = [...new Set([...(await this.grantsOf(player)), ...added])];
    await this.store.updatePlayer(player.id, { grants: JSON.stringify(grants), last_seen: this.now() });
    return this.json(200, { code: player.code, pin, grants, added, already: outcome === 'already' });
  }

  private async dailyPost(req: ApiRequest) {
    const body = this.parse(req);
    const { date, scores } = body;
    if (!isDateKey(date)) throw new HttpError(400, 'date');
    const today = this.now();
    if (date < dateKey(today - 2 * DAY) || date > dateKey(today + DAY)) throw new HttpError(400, 'date');
    const bad = checkScores(date, scores);
    if (bad) throw new HttpError(422, 'implausible');
    await this.limit(`daily:${await this.ipKey(req)}`, LIMITS.dailyPerDay, 86_400);
    const { player, pin } = await this.device(req, true);
    const nickname = cleanNickname(body.nickname);
    const meta = this.meta(body);
    await this.store.updatePlayer(player.id, meta);
    const row: DailyRow = {
      date,
      player_id: player.id,
      nickname: nickname === undefined ? player.nickname : nickname,
      scores: JSON.stringify(scores),
      created_at: today,
    };
    const fresh = await this.store.insertDaily(row);
    if (fresh) this.boards.delete(date);
    return this.json(200, { ok: true, duplicate: !fresh, tag: await this.tag(player.id), code: player.code, pin, grants: await this.grantsOf(player) });
  }

  /** A short public tag for a player on the board; the app can work out its own from its id. */
  private async tag(id: string) {
    return (await sha256(`tag:${id}`)).slice(0, 6);
  }

  async board(date: string): Promise<Board> {
    const hit = this.boards.get(date);
    if (hit && this.now() - hit.at < 60_000) return hit.board;
    const rows = await this.store.listDaily(date);
    const categories = planCategories(date);
    const parsed = rows.map((r) => {
      let s: Record<string, number> = {};
      try {
        s = JSON.parse(r.scores) as Record<string, number>;
      } catch {
        /* skip */
      }
      return { r, s };
    });
    const sorted: Record<string, number[]> = {};
    for (const c of categories) sorted[c] = parsed.map((x) => x.s[c]).filter((v): v is number => typeof v === 'number').sort((a, b) => a - b);
    const ranked = parsed
      .map((x) => ({ x, score: categories.reduce((a, c) => a + beatShare(sorted[c], x.s[c] ?? 0), 0) / categories.length }))
      .sort((a, b) => b.score - a.score || a.x.r.created_at - b.x.r.created_at)
      .slice(0, 20);
    const top = await Promise.all(
      ranked.map(async ({ x, score }) => ({ name: x.r.nickname, tag: await this.tag(x.r.player_id), score: Math.round(score * 100), scores: x.s })),
    );
    const board: Board = { date, n: rows.length, categories, values: Object.fromEntries(categories.map((c) => [c, sample(sorted[c])])), top };
    this.boards.set(date, { at: this.now(), board });
    if (this.boards.size > 8) this.boards.delete(this.boards.keys().next().value!);
    return board;
  }

  private async dailyGet(date: string) {
    if (!isDateKey(date) || date > dateKey(this.now() + DAY)) throw new HttpError(400, 'date');
    return this.json(200, await this.board(date), { 'Cache-Control': 'public, max-age=60' });
  }

  // ---------- admin ----------

  private async admin(req: ApiRequest): Promise<ApiResponse> {
    const token = this.env.ADMIN_TOKEN ?? '';
    if (token.length < 24) throw new HttpError(503, 'admin off');
    const ip = (await hmac(token, `ip:${req.ip}`)).slice(0, 20);
    const failKey = `adminfail:${ip}`;
    if ((await this.store.peek(failKey, 3600, this.now())) >= LIMITS.adminFailsPerHour) throw new HttpError(429, 'slow down');
    const m = /^Bearer (.+)$/.exec(req.header('Authorization') ?? '');
    if (!m || !safeEqual(m[1], token)) {
      await this.store.hit(failKey, 3600, this.now());
      throw new HttpError(401, 'auth');
    }
    const sub = req.path.slice('/admin/api'.length);
    const { method } = req;

    if (method === 'GET' && sub === '/stats') {
      const today = dateKey(this.now());
      return this.json(200, { players: await this.store.countPlayers(), dailyToday: (await this.store.listDaily(today)).length, today, grantable: GRANTABLE });
    }
    if (method === 'GET' && sub === '/players') {
      const q = (req.query.get('q') ?? '').slice(0, 64);
      const offset = Math.max(0, Math.min(1_000_000, Number(req.query.get('offset')) || 0));
      const rows = await this.store.listPlayers({ q: q || undefined, limit: 50, offset });
      return this.json(200, {
        players: rows.map((p) => ({
          id: p.id,
          code: p.code,
          nickname: p.nickname,
          lastSeen: p.last_seen,
          createdAt: p.created_at,
          generation: p.generation,
          packs: parseList(p.packs),
          grants: parseList(p.grants),
          savedAt: p.saved_at,
          saveSize: p.save_size,
        })),
      });
    }
    const pm = /^\/players\/([A-Za-z0-9_-]{16,64})$/.exec(sub);
    if (pm) {
      const player = await this.store.getPlayer(pm[1]);
      if (!player) throw new HttpError(404, 'not found');
      if (method === 'DELETE') {
        await this.store.deletePlayer(player.id);
        this.boards.clear();
        return this.json(200, { deleted: true });
      }
      if (method === 'POST') {
        const body = this.parse(req);
        const patch: Partial<PlayerRow> = {};
        if (body.grants !== undefined) {
          if (!Array.isArray(body.grants) || !body.grants.every(isGrantable)) throw new HttpError(400, 'grants');
          patch.grants = JSON.stringify([...new Set(body.grants as string[])]);
        }
        if (body.clearNickname === true) patch.nickname = null;
        await this.store.updatePlayer(player.id, patch);
        return this.json(200, { ok: true });
      }
    }
    if (method === 'GET' && sub === '/gifts') {
      const gifts = await this.store.listGifts();
      return this.json(200, {
        gifts: gifts.map((g) => ({ code: g.code, grants: parseList(g.grants), maxUses: g.max_uses, uses: g.uses, expiresAt: g.expires_at, note: g.note, createdAt: g.created_at })),
      });
    }
    if (method === 'POST' && sub === '/gifts') {
      const body = this.parse(req);
      const code = body.code === undefined || body.code === '' ? `GIFT-${randomString(8)}` : normalizeGiftCode(body.code);
      if (!code) throw new HttpError(400, 'code');
      if (!Array.isArray(body.grants) || !body.grants.length || !body.grants.every(isGrantable)) throw new HttpError(400, 'grants');
      const maxUses = Number(body.maxUses ?? 1);
      if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1_000_000) throw new HttpError(400, 'maxUses');
      const days = body.days === undefined || body.days === null || body.days === '' ? null : Number(body.days);
      if (days !== null && (!Number.isFinite(days) || days <= 0 || days > 3650)) throw new HttpError(400, 'days');
      if (await this.store.getGift(code)) throw new HttpError(409, 'exists');
      const now = this.now();
      const row: GiftRow = {
        code,
        grants: JSON.stringify([...new Set(body.grants as string[])]),
        max_uses: maxUses,
        uses: 0,
        expires_at: days === null ? null : now + days * DAY,
        note: typeof body.note === 'string' ? body.note.slice(0, 80) : null,
        created_at: now,
      };
      await this.store.putGift(row);
      return this.json(200, { code });
    }
    const gm = /^\/gifts\/([0-9A-Za-z-]{4,24})$/.exec(sub);
    if (method === 'DELETE' && gm) {
      const code = normalizeGiftCode(gm[1]);
      if (code) await this.store.deleteGift(code);
      return this.json(200, { deleted: true });
    }
    throw new HttpError(404, 'not found');
  }

  /** The nightly clean-up (Cron Trigger): old leaderboards, forgotten families and spent rate counters. */
  async cleanup(): Promise<void> {
    const now = this.now();
    await this.store.cleanup(now, { dailyBefore: dateKey(now - LIMITS.dailyKeepDays * DAY), staleBefore: now - LIMITS.playerKeepDays * DAY });
  }
}
