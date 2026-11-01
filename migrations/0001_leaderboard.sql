-- Accounts that joined the X Growth Leaderboard.
CREATE TABLE IF NOT EXISTS accounts (
  handle      TEXT PRIMARY KEY COLLATE NOCASE,   -- X username, without @
  name        TEXT,                              -- display name, filled in by the scraper
  avatar_url  TEXT,                              -- filled in by the scraper
  joined_at   TEXT NOT NULL,                     -- ISO time
  status      TEXT NOT NULL DEFAULT 'active'     -- active | not_found | suspended | protected
);

-- One follower count per account per day, written by the daily scraper.
CREATE TABLE IF NOT EXISTS snapshots (
  handle      TEXT NOT NULL COLLATE NOCASE,
  day         TEXT NOT NULL,                     -- YYYY-MM-DD (New York date of the update)
  followers   INTEGER NOT NULL,
  checked_at  TEXT NOT NULL,                     -- ISO time
  PRIMARY KEY (handle, day)
);

CREATE INDEX IF NOT EXISTS snapshots_day ON snapshots (day);
