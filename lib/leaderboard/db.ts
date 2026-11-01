import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nextSnapshotAfter } from "./demo-data";
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse, PendingAccount } from "./types";

/* Minimal D1 types so we don't depend on generated cloudflare-env.d.ts. */
interface D1Result<T> {
  results: T[];
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

/** The LEADERBOARD_DB binding, or null when it isn't configured. */
export function getDb(): D1Database | null {
  try {
    const env = getCloudflareContext().env as unknown as { LEADERBOARD_DB?: D1Database };
    return env.LEADERBOARD_DB ?? null;
  } catch {
    return null;
  }
}

/**
 * Same tables as migrations/0001 and 0002, created on first use so a fresh
 * local database works without running the migrations by hand.
 */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
     handle TEXT PRIMARY KEY COLLATE NOCASE, name TEXT, avatar_url TEXT,
     joined_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active')`,
  `CREATE TABLE IF NOT EXISTS snapshots (
     handle TEXT NOT NULL COLLATE NOCASE, day TEXT NOT NULL, followers INTEGER NOT NULL,
     checked_at TEXT NOT NULL, PRIMARY KEY (handle, day))`,
  `CREATE INDEX IF NOT EXISTS snapshots_day ON snapshots (day)`,
  `CREATE TABLE IF NOT EXISTS signup_profiles (
     handle TEXT PRIMARY KEY COLLATE NOCASE, status TEXT NOT NULL, name TEXT, avatar_url TEXT,
     followers INTEGER, checked_at TEXT NOT NULL)`,
];
let schemaReady: Promise<void> | null = null;
function ensureSchema(db: D1Database): Promise<void> {
  schemaReady ??= db
    .batch(SCHEMA.map((sql) => db.prepare(sql)))
    .then(() => undefined)
    .catch((err) => {
      schemaReady = null;
      throw err;
    });
  return schemaReady;
}

/* ------------------------------------------------------------------ */

export async function joinAccount(
  db: D1Database,
  handle: string,
): Promise<{ handle: string; status: "joined" | "already_joined" }> {
  await ensureSchema(db);
  const res = await db
    .prepare(`INSERT INTO accounts (handle, joined_at) VALUES (?, ?) ON CONFLICT(handle) DO NOTHING`)
    .bind(handle, new Date().toISOString())
    .run();
  if (res.meta.changes > 0) return { handle, status: "joined" };
  // Return the stored spelling ("gauravatavale" -> "GauravAtavale").
  const row = await db.prepare(`SELECT handle FROM accounts WHERE handle = ?`).bind(handle).first<{ handle: string }>();
  return { handle: row?.handle ?? handle, status: "already_joined" };
}

/* ------------------------------------------------------------------ */
/* Sign-up scraper                                                      */
/* ------------------------------------------------------------------ */

/** The secret the scraper must send, from LEADERBOARD_SCRAPER_KEY. */
export function getScraperKey(): string | null {
  try {
    const env = getCloudflareContext().env as unknown as { LEADERBOARD_SCRAPER_KEY?: string };
    return env.LEADERBOARD_SCRAPER_KEY || process.env.LEADERBOARD_SCRAPER_KEY || null;
  } catch {
    return process.env.LEADERBOARD_SCRAPER_KEY || null;
  }
}

/** Today's date in New York, YYYY-MM-DD. Snapshots are keyed by this. */
export function nyDay(at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(at);
}

/** Active accounts the sign-up scraper hasn't looked at yet, oldest first. */
export async function listNewSignups(db: D1Database, limit = 200) {
  await ensureSchema(db);
  const rows = await db
    .prepare(
      `SELECT a.handle, a.joined_at FROM accounts a
       LEFT JOIN signup_profiles p ON p.handle = a.handle
       WHERE p.handle IS NULL AND a.status = 'active'
       ORDER BY a.joined_at LIMIT ?`,
    )
    .bind(limit)
    .all<{ handle: string; joined_at: string }>();
  return rows.results.map((r) => ({ handle: r.handle, joinedAt: r.joined_at }));
}

export interface SignupProfile {
  handle: string;
  status: "ok" | "not_found" | "suspended";
  /** The handle as X spells it (x.com redirects to the canonical case). */
  canonicalHandle?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  followers?: number | null;
}

/**
 * Saves what the scraper found:
 *   ok        -> name + photo on the account, the sign-up record, and a first daily snapshot
 *   not_found / suspended -> account marked so it leaves the board and isn't re-checked
 */
export async function saveSignupProfiles(db: D1Database, profiles: SignupProfile[]) {
  await ensureSchema(db);
  const now = new Date();
  const checkedAt = now.toISOString();
  const day = nyDay(now);
  const statements: D1PreparedStatement[] = [];

  for (const p of profiles) {
    if (p.status === "ok") {
      const handle = p.canonicalHandle || p.handle;
      statements.push(
        // handle is COLLATE NOCASE, so this also fixes "gauravatavale" -> "GauravAtavale"
        db.prepare(`UPDATE accounts SET handle = ?, name = ?, avatar_url = ? WHERE handle = ?`)
          .bind(handle, p.name ?? null, p.avatarUrl ?? null, p.handle),
        db.prepare(
          `INSERT INTO signup_profiles (handle, status, name, avatar_url, followers, checked_at)
           VALUES (?, 'ok', ?, ?, ?, ?)
           ON CONFLICT(handle) DO UPDATE SET status = excluded.status, name = excluded.name,
             avatar_url = excluded.avatar_url, followers = excluded.followers, checked_at = excluded.checked_at`,
        ).bind(handle, p.name ?? null, p.avatarUrl ?? null, p.followers!, checkedAt),
        // First point on the follower history. The daily scraper owns later days
        // and may overwrite this one; a sign-up never overwrites a daily reading.
        db.prepare(
          `INSERT INTO snapshots (handle, day, followers, checked_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(handle, day) DO NOTHING`,
        ).bind(handle, day, p.followers!, checkedAt),
      );
    } else {
      statements.push(
        db.prepare(`UPDATE accounts SET status = ? WHERE handle = ?`).bind(p.status, p.handle),
        db.prepare(
          `INSERT INTO signup_profiles (handle, status, checked_at) VALUES (?, ?, ?)
           ON CONFLICT(handle) DO UPDATE SET status = excluded.status, checked_at = excluded.checked_at`,
        ).bind(p.handle, p.status, checkedAt),
      );
    }
  }
  if (statements.length) await db.batch(statements);
  return { saved: profiles.length, day };
}

/* ------------------------------------------------------------------ */

interface AccountRow {
  handle: string;
  name: string | null;
  avatar_url: string | null;
  joined_at: string;
}
interface SnapshotRow {
  handle: string;
  day: string;
  followers: number;
  checked_at: string;
}

const HISTORY_POINTS = 8;
const LOOKBACK_DAYS = 16; // enough for this week + last week's ranks

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Last snapshot on or before `day`. `series` is sorted oldest first. */
function atOrBefore(series: SnapshotRow[], day: string): SnapshotRow | undefined {
  for (let i = series.length - 1; i >= 0; i--) if (series[i].day <= day) return series[i];
  return undefined;
}

/**
 * Gain for one account as of `asOf`:
 *   day  -> latest snapshot minus the snapshot before it
 *   week -> latest snapshot minus the last one at least 7 days earlier
 *           (or the first one, if the account joined less than a week ago)
 * Returns null when there are fewer than two snapshots to compare.
 */
function gainAsOf(series: SnapshotRow[], period: LeaderboardPeriod, asOf: string) {
  const latest = atOrBefore(series, asOf);
  if (!latest) return null;
  const earlier = series.filter((s) => s.day < latest.day);
  if (earlier.length === 0) return null;
  const base =
    period === "day"
      ? earlier[earlier.length - 1]
      : (atOrBefore(earlier, addDays(latest.day, -7)) ?? earlier[0]);
  return { gain: latest.followers - base.followers, latest, base };
}

function rankMap(gains: Array<{ handle: string; gain: number; followers: number }>) {
  const sorted = [...gains].sort((a, b) => b.gain - a.gain || b.followers - a.followers);
  return new Map(sorted.map((g, i) => [g.handle.toLowerCase(), i + 1]));
}

export async function buildLeaderboard(db: D1Database, period: LeaderboardPeriod): Promise<LeaderboardResponse> {
  await ensureSchema(db);
  const now = new Date();

  const accounts = (
    await db
      .prepare(`SELECT handle, name, avatar_url, joined_at FROM accounts WHERE status = 'active' ORDER BY joined_at`)
      .all<AccountRow>()
  ).results;

  const latestDay =
    (await db.prepare(`SELECT MAX(day) AS day FROM snapshots`).first<{ day: string | null }>())?.day ?? null;

  const snapshots = latestDay
    ? (
        await db
          .prepare(`SELECT handle, day, followers, checked_at FROM snapshots WHERE day >= ? ORDER BY day`)
          .bind(addDays(latestDay, -LOOKBACK_DAYS))
          .all<SnapshotRow>()
      ).results
    : [];

  const byHandle = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const key = s.handle.toLowerCase();
    (byHandle.get(key) ?? byHandle.set(key, []).get(key)!).push(s);
  }

  const ranked: Array<{
    account: AccountRow;
    series: SnapshotRow[];
    gain: number;
    followers: number;
    startFollowers: number;
  }> = [];
  const pending: PendingAccount[] = [];
  const previous: Array<{ handle: string; gain: number; followers: number }> = [];

  for (const account of accounts) {
    const series = byHandle.get(account.handle.toLowerCase()) ?? [];
    const now_ = latestDay ? gainAsOf(series, period, latestDay) : null;
    if (!now_) {
      pending.push({
        handle: account.handle,
        name: account.name,
        avatarUrl: account.avatar_url,
        joinedAt: account.joined_at,
      });
      continue;
    }
    ranked.push({
      account,
      series,
      gain: now_.gain,
      followers: now_.latest.followers,
      startFollowers: now_.base.followers,
    });
    const prev = gainAsOf(series, period, addDays(latestDay!, -1));
    if (prev) previous.push({ handle: account.handle, gain: prev.gain, followers: prev.latest.followers });
  }

  const currentRanks = rankMap(ranked.map((r) => ({ handle: r.account.handle, gain: r.gain, followers: r.followers })));
  const previousRanks = rankMap(previous);

  const entries: LeaderboardEntry[] = ranked
    .map((r) => {
      const key = r.account.handle.toLowerCase();
      return {
        rank: currentRanks.get(key)!,
        previousRank: previousRanks.get(key) ?? null,
        handle: r.account.handle,
        name: r.account.name ?? r.account.handle,
        avatarUrl: r.account.avatar_url,
        followers: r.followers,
        startFollowers: r.startFollowers,
        gain: r.gain,
        history: r.series.slice(-HISTORY_POINTS).map((s) => s.followers),
        joinedAt: r.account.joined_at,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  const updatedAt = latestDay
    ? (snapshots.filter((s) => s.day === latestDay).map((s) => s.checked_at).sort().pop() ?? null)
    : null;

  return {
    period,
    updatedAt,
    nextUpdateAt: nextSnapshotAfter(now).toISOString(),
    totalParticipants: accounts.length,
    totalGain: entries.reduce((sum, e) => sum + e.gain, 0),
    entries,
    pending,
    demo: false,
  };
}
