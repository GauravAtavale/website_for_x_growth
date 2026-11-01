-- What the sign-up scraper saw the first time it looked at each account:
-- display name, profile photo and follower count at the time they joined.
-- An account with no row here is still waiting for that first look.
CREATE TABLE IF NOT EXISTS signup_profiles (
  handle      TEXT PRIMARY KEY COLLATE NOCASE,
  status      TEXT NOT NULL,                     -- ok | not_found | suspended
  name        TEXT,
  avatar_url  TEXT,
  followers   INTEGER,                           -- null unless status = ok
  checked_at  TEXT NOT NULL                      -- ISO time
);
