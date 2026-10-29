// The Store on Cloudflare D1 (SQLite). Tables are in ../schema.sql.
import type { DailyRow, GiftRow, PlayerRow, RedeemOutcome, SaveRow, Store } from './store';

/** The parts of the D1 binding this file uses (so it type-checks without @cloudflare/workers-types). */
export interface D1Like {
  prepare(sql: string): D1Stmt;
  batch(stmts: D1Stmt[]): Promise<unknown[]>;
}
export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
}

const PLAYER_COLS = ['secret_hash', 'code', 'pin_hash', 'nickname', 'grants', 'generation', 'packs', 'created_at', 'last_seen', 'saved_at', 'save_size'] as const;

export class D1Store implements Store {
  constructor(private db: D1Like) {}

  getPlayer(id: string) {
    return this.db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first<PlayerRow>();
  }
  getPlayerByCode(code: string) {
    return this.db.prepare('SELECT * FROM players WHERE code = ?').bind(code).first<PlayerRow>();
  }
  async insertPlayer(p: PlayerRow) {
    await this.db
      .prepare(`INSERT INTO players (id, ${PLAYER_COLS.join(', ')}) VALUES (?${', ?'.repeat(PLAYER_COLS.length)})`)
      .bind(p.id, ...PLAYER_COLS.map((c) => p[c]))
      .run();
  }
  async updatePlayer(id: string, patch: Partial<Omit<PlayerRow, 'id'>>) {
    const cols = PLAYER_COLS.filter((c) => c in patch);
    if (!cols.length) return;
    await this.db
      .prepare(`UPDATE players SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
      .bind(...cols.map((c) => patch[c] ?? null), id)
      .run();
  }
  async deletePlayer(id: string) {
    await this.db.batch([
      this.db.prepare('DELETE FROM saves WHERE player_id = ?').bind(id),
      this.db.prepare('DELETE FROM daily WHERE player_id = ?').bind(id),
      this.db.prepare('DELETE FROM redemptions WHERE player_id = ?').bind(id),
      this.db.prepare('DELETE FROM players WHERE id = ?').bind(id),
    ]);
  }
  async listPlayers({ q, limit, offset }: { q?: string; limit: number; offset: number }) {
    if (q) {
      const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      const { results } = await this.db
        .prepare("SELECT * FROM players WHERE id LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\' OR nickname LIKE ? ESCAPE '\\' ORDER BY last_seen DESC LIMIT ? OFFSET ?")
        .bind(`${like.slice(1)}`, like.toUpperCase(), like, limit, offset)
        .all<PlayerRow>();
      return results;
    }
    const { results } = await this.db.prepare('SELECT * FROM players ORDER BY last_seen DESC LIMIT ? OFFSET ?').bind(limit, offset).all<PlayerRow>();
    return results;
  }
  async countPlayers() {
    return (await this.db.prepare('SELECT COUNT(*) AS n FROM players').first<{ n: number }>())?.n ?? 0;
  }

  getSave(playerId: string) {
    return this.db.prepare('SELECT * FROM saves WHERE player_id = ?').bind(playerId).first<SaveRow>();
  }
  async putSave(s: SaveRow) {
    await this.db
      .prepare('INSERT INTO saves (player_id, enc, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(player_id) DO UPDATE SET enc = excluded.enc, data = excluded.data, updated_at = excluded.updated_at')
      .bind(s.player_id, s.enc, s.data, s.updated_at)
      .run();
  }

  async insertDaily(d: DailyRow) {
    const r = await this.db
      .prepare('INSERT OR IGNORE INTO daily (date, player_id, nickname, scores, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(d.date, d.player_id, d.nickname, d.scores, d.created_at)
      .run();
    return (r.meta.changes ?? 0) > 0;
  }
  getDaily(date: string, playerId: string) {
    return this.db.prepare('SELECT * FROM daily WHERE date = ? AND player_id = ?').bind(date, playerId).first<DailyRow>();
  }
  async listDaily(date: string) {
    const { results } = await this.db.prepare('SELECT * FROM daily WHERE date = ?').bind(date).all<DailyRow>();
    return results;
  }

  getGift(code: string) {
    return this.db.prepare('SELECT * FROM gifts WHERE code = ?').bind(code).first<GiftRow>();
  }
  async listGifts() {
    const { results } = await this.db.prepare('SELECT * FROM gifts ORDER BY created_at DESC LIMIT 500').all<GiftRow>();
    return results;
  }
  async putGift(g: GiftRow) {
    await this.db
      .prepare('INSERT OR REPLACE INTO gifts (code, grants, max_uses, uses, expires_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(g.code, g.grants, g.max_uses, g.uses, g.expires_at, g.note, g.created_at)
      .run();
  }
  async deleteGift(code: string) {
    await this.db.batch([this.db.prepare('DELETE FROM redemptions WHERE code = ?').bind(code), this.db.prepare('DELETE FROM gifts WHERE code = ?').bind(code)]);
  }
  async redeemGift(code: string, playerId: string, now: number): Promise<RedeemOutcome> {
    const seen = await this.db.prepare('SELECT 1 AS x FROM redemptions WHERE code = ? AND player_id = ?').bind(code, playerId).first();
    if (seen) return 'already';
    // take a use only while uses < max_uses (one statement, so two phones cannot both take the last one)
    const taken = await this.db.prepare('UPDATE gifts SET uses = uses + 1 WHERE code = ? AND uses < max_uses').bind(code).run();
    if (!taken.meta.changes) return 'exhausted';
    const ins = await this.db.prepare('INSERT OR IGNORE INTO redemptions (code, player_id, at) VALUES (?, ?, ?)').bind(code, playerId, now).run();
    if (!ins.meta.changes) {
      await this.db.prepare('UPDATE gifts SET uses = uses - 1 WHERE code = ?').bind(code).run();
      return 'already';
    }
    return 'ok';
  }

  async hit(key: string, windowSec: number, now: number) {
    const bucket = Math.floor(now / 1000 / windowSec);
    const row = await this.db
      .prepare('INSERT INTO rate (k, n, expires) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n')
      .bind(`${key}|${windowSec}|${bucket}`, (bucket + 1) * windowSec * 1000)
      .first<{ n: number }>();
    return row?.n ?? 1;
  }
  async peek(key: string, windowSec: number, now: number) {
    const bucket = Math.floor(now / 1000 / windowSec);
    return (await this.db.prepare('SELECT n FROM rate WHERE k = ?').bind(`${key}|${windowSec}|${bucket}`).first<{ n: number }>())?.n ?? 0;
  }
  async cleanup(now: number, { dailyBefore, staleBefore }: { dailyBefore: string; staleBefore: number }) {
    await this.db.batch([
      this.db.prepare('DELETE FROM rate WHERE expires <= ?').bind(now),
      this.db.prepare('DELETE FROM daily WHERE date < ?').bind(dailyBefore),
      this.db.prepare('DELETE FROM saves WHERE player_id IN (SELECT id FROM players WHERE last_seen < ?)').bind(staleBefore),
      this.db.prepare('DELETE FROM daily WHERE player_id IN (SELECT id FROM players WHERE last_seen < ?)').bind(staleBefore),
      this.db.prepare('DELETE FROM redemptions WHERE player_id IN (SELECT id FROM players WHERE last_seen < ?)').bind(staleBefore),
      this.db.prepare('DELETE FROM players WHERE last_seen < ?').bind(staleBefore),
    ]);
  }
}
