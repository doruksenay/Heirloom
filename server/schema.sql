-- Heirloom cloud (Cloudflare D1). Run once:  npx wrangler d1 execute heirloom --remote --file=schema.sql
-- No personal data: ids are random, secrets and PINs are stored hashed, IP addresses only as keyed hashes inside
-- rate counters that expire within a day.

CREATE TABLE IF NOT EXISTS players (
  id          TEXT PRIMARY KEY,          -- random install id made by the app
  secret_hash TEXT NOT NULL,             -- SHA-256 of the device secret
  code        TEXT NOT NULL UNIQUE,      -- family code, HLM-XXXX-XXXX
  pin_hash    TEXT NOT NULL,             -- HMAC(PEPPER, code + PIN)
  nickname    TEXT,                      -- optional, leaderboard only
  grants      TEXT NOT NULL DEFAULT '[]',-- entitlements from the admin or gift codes (JSON array)
  generation  INTEGER NOT NULL DEFAULT 0,
  packs       TEXT NOT NULL DEFAULT '[]',-- entitlements the app reports as owned (JSON array)
  created_at  INTEGER NOT NULL,          -- ms since 1970
  last_seen   INTEGER NOT NULL,
  saved_at    INTEGER,
  save_size   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS players_last_seen ON players (last_seen);

CREATE TABLE IF NOT EXISTS saves (
  player_id  TEXT PRIMARY KEY,
  enc        TEXT NOT NULL,              -- 'gzip64' or 'json'
  data       TEXT NOT NULL,              -- at most 1,000,000 characters
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily (
  date       TEXT NOT NULL,              -- YYYY-MM-DD (UTC)
  player_id  TEXT NOT NULL,
  nickname   TEXT,
  scores     TEXT NOT NULL,              -- JSON object category -> value
  created_at INTEGER NOT NULL,
  PRIMARY KEY (date, player_id)          -- one entry per install per day
);
CREATE INDEX IF NOT EXISTS daily_player ON daily (player_id);

CREATE TABLE IF NOT EXISTS gifts (
  code       TEXT PRIMARY KEY,
  grants     TEXT NOT NULL,              -- JSON array of entitlement ids
  max_uses   INTEGER NOT NULL DEFAULT 1,
  uses       INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,
  note       TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS redemptions (
  code      TEXT NOT NULL,
  player_id TEXT NOT NULL,
  at        INTEGER NOT NULL,
  PRIMARY KEY (code, player_id)
);
CREATE INDEX IF NOT EXISTS redemptions_player ON redemptions (player_id);

CREATE TABLE IF NOT EXISTS rate (
  k       TEXT PRIMARY KEY,              -- what|hashed key|window|bucket
  n       INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_expires ON rate (expires);
