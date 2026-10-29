// The storage the API needs, as a small interface. D1 implements it in d1.ts; MemoryStore below backs the tests.

export interface PlayerRow {
  /** Random install id made by the app. */
  id: string;
  /** SHA-256 of the device secret. */
  secret_hash: string;
  /** Family code, e.g. HLM-7K2Q-9XPA. */
  code: string;
  /** HMAC of code + PIN with the server pepper. */
  pin_hash: string;
  nickname: string | null;
  /** JSON array of entitlement ids granted by the admin or by gift codes. */
  grants: string;
  /** Dynasty generation of the uploaded family (for the admin list). */
  generation: number;
  /** JSON array of entitlement ids the app reports as owned (purchases), for the admin list. */
  packs: string;
  created_at: number;
  last_seen: number;
  saved_at: number | null;
  save_size: number;
}

export interface SaveRow {
  player_id: string;
  /** 'gzip64' (gzip, then base64) or 'json'. */
  enc: string;
  data: string;
  updated_at: number;
}

export interface DailyRow {
  date: string;
  player_id: string;
  nickname: string | null;
  /** JSON object category id -> value. */
  scores: string;
  created_at: number;
}

export interface GiftRow {
  code: string;
  /** JSON array of entitlement ids. */
  grants: string;
  max_uses: number;
  uses: number;
  expires_at: number | null;
  note: string | null;
  created_at: number;
}

export type RedeemOutcome = 'ok' | 'already' | 'exhausted';

export interface Store {
  getPlayer(id: string): Promise<PlayerRow | null>;
  getPlayerByCode(code: string): Promise<PlayerRow | null>;
  insertPlayer(row: PlayerRow): Promise<void>;
  updatePlayer(id: string, patch: Partial<Omit<PlayerRow, 'id'>>): Promise<void>;
  /** Deletes the player and everything that belongs to them. */
  deletePlayer(id: string): Promise<void>;
  listPlayers(opts: { q?: string; limit: number; offset: number }): Promise<PlayerRow[]>;
  countPlayers(): Promise<number>;

  getSave(playerId: string): Promise<SaveRow | null>;
  putSave(row: SaveRow): Promise<void>;

  /** False if this player already has an entry for the date. */
  insertDaily(row: DailyRow): Promise<boolean>;
  getDaily(date: string, playerId: string): Promise<DailyRow | null>;
  listDaily(date: string): Promise<DailyRow[]>;

  getGift(code: string): Promise<GiftRow | null>;
  listGifts(): Promise<GiftRow[]>;
  putGift(row: GiftRow): Promise<void>;
  deleteGift(code: string): Promise<void>;
  /** Records that a player used a gift code, at most once per player and at most max_uses in total. */
  redeemGift(code: string, playerId: string, now: number): Promise<RedeemOutcome>;

  /** Counts a hit in a fixed window and returns the count so far (this one included). */
  hit(key: string, windowSec: number, now: number): Promise<number>;
  /** The count in the current window, without counting. */
  peek(key: string, windowSec: number, now: number): Promise<number>;
  /** Removes expired rate counters, old daily entries and players not seen since `staleBefore`. */
  cleanup(now: number, opts: { dailyBefore: string; staleBefore: number }): Promise<void>;
}

/** An in-memory Store for tests and local experiments. */
export class MemoryStore implements Store {
  players = new Map<string, PlayerRow>();
  saves = new Map<string, SaveRow>();
  daily = new Map<string, DailyRow>();
  gifts = new Map<string, GiftRow>();
  redemptions = new Set<string>();
  rate = new Map<string, { count: number; expires: number }>();

  async getPlayer(id: string) {
    const p = this.players.get(id);
    return p ? { ...p } : null;
  }
  async getPlayerByCode(code: string) {
    for (const p of this.players.values()) if (p.code === code) return { ...p };
    return null;
  }
  async insertPlayer(row: PlayerRow) {
    if (this.players.has(row.id) || [...this.players.values()].some((p) => p.code === row.code)) throw new Error('UNIQUE constraint failed');
    this.players.set(row.id, { ...row });
  }
  async updatePlayer(id: string, patch: Partial<Omit<PlayerRow, 'id'>>) {
    const p = this.players.get(id);
    if (p) this.players.set(id, { ...p, ...patch });
  }
  async deletePlayer(id: string) {
    this.players.delete(id);
    this.saves.delete(id);
    for (const [k, d] of [...this.daily]) if (d.player_id === id) this.daily.delete(k);
    for (const r of [...this.redemptions]) if (r.endsWith(`|${id}`)) this.redemptions.delete(r);
  }
  async listPlayers({ q, limit, offset }: { q?: string; limit: number; offset: number }) {
    const needle = (q ?? '').toLowerCase();
    return [...this.players.values()]
      .filter((p) => !needle || p.id.toLowerCase().startsWith(needle) || p.code.toLowerCase().includes(needle) || (p.nickname ?? '').toLowerCase().includes(needle))
      .sort((a, b) => b.last_seen - a.last_seen)
      .slice(offset, offset + limit)
      .map((p) => ({ ...p }));
  }
  async countPlayers() {
    return this.players.size;
  }
  async getSave(playerId: string) {
    const s = this.saves.get(playerId);
    return s ? { ...s } : null;
  }
  async putSave(row: SaveRow) {
    this.saves.set(row.player_id, { ...row });
  }
  async insertDaily(row: DailyRow) {
    const k = `${row.date}|${row.player_id}`;
    if (this.daily.has(k)) return false;
    this.daily.set(k, { ...row });
    return true;
  }
  async getDaily(date: string, playerId: string) {
    const d = this.daily.get(`${date}|${playerId}`);
    return d ? { ...d } : null;
  }
  async listDaily(date: string) {
    return [...this.daily.values()].filter((d) => d.date === date).map((d) => ({ ...d }));
  }
  async getGift(code: string) {
    const g = this.gifts.get(code);
    return g ? { ...g } : null;
  }
  async listGifts() {
    return [...this.gifts.values()].sort((a, b) => b.created_at - a.created_at).map((g) => ({ ...g }));
  }
  async putGift(row: GiftRow) {
    this.gifts.set(row.code, { ...row });
  }
  async deleteGift(code: string) {
    this.gifts.delete(code);
    for (const r of [...this.redemptions]) if (r.startsWith(`${code}|`)) this.redemptions.delete(r);
  }
  async redeemGift(code: string, playerId: string, _now: number): Promise<RedeemOutcome> {
    const g = this.gifts.get(code);
    if (!g) return 'exhausted';
    const k = `${code}|${playerId}`;
    if (this.redemptions.has(k)) return 'already';
    if (g.uses >= g.max_uses) return 'exhausted';
    this.redemptions.add(k);
    g.uses += 1;
    return 'ok';
  }
  async hit(key: string, windowSec: number, now: number) {
    const bucket = Math.floor(now / 1000 / windowSec);
    const k = `${key}|${windowSec}|${bucket}`;
    const cur = this.rate.get(k) ?? { count: 0, expires: (bucket + 1) * windowSec * 1000 };
    cur.count += 1;
    this.rate.set(k, cur);
    return cur.count;
  }
  async peek(key: string, windowSec: number, now: number) {
    const bucket = Math.floor(now / 1000 / windowSec);
    return this.rate.get(`${key}|${windowSec}|${bucket}`)?.count ?? 0;
  }
  async cleanup(now: number, { dailyBefore, staleBefore }: { dailyBefore: string; staleBefore: number }) {
    for (const [k, r] of [...this.rate]) if (r.expires <= now) this.rate.delete(k);
    for (const [k, d] of [...this.daily]) if (d.date < dailyBefore) this.daily.delete(k);
    for (const p of [...this.players.values()]) if (p.last_seen < staleBefore) await this.deletePlayer(p.id);
  }
}
