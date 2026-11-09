import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nextNyMidnight, nyMidnightOn as nextNyMidnightOn, nyDay as nyDayFn } from "./time";
import { addDays, weekOf, weekRange } from "./weeks";
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
export const nyDay = nyDayFn;

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
/* Hourly tracker                                                       */
/* ------------------------------------------------------------------ */

/**
 * Every active account, with when it was last read. The tracker skips accounts
 * read recently, so a run that was stopped part-way can simply be re-run.
 */
export async function listTrackedAccounts(db: D1Database) {
  await ensureSchema(db);
  const rows = await db
    .prepare(
      `SELECT a.handle, MAX(s.checked_at) AS last_checked_at FROM accounts a
       LEFT JOIN snapshots s ON s.handle = a.handle
       WHERE a.status = 'active'
       GROUP BY a.handle
       ORDER BY last_checked_at IS NOT NULL, last_checked_at, a.joined_at`,
    )
    .all<{ handle: string; last_checked_at: string | null }>();
  return rows.results.map((r) => ({ handle: r.handle, lastCheckedAt: r.last_checked_at }));
}

/**
 * Saves one hourly reading per account. Snapshots hold one row per account per
 * New York day, so each reading replaces that day's earlier one: during the day
 * it is "followers right now", and the last reading of the day is the day's close
 * that tomorrow's gains are measured from. Name and photo are refreshed too.
 */
export async function saveReadings(db: D1Database, readings: SignupProfile[]) {
  await ensureSchema(db);
  const now = new Date();
  const checkedAt = now.toISOString();
  const day = nyDay(now);
  const statements: D1PreparedStatement[] = [];

  for (const r of readings) {
    if (r.status === "ok") {
      const handle = r.canonicalHandle || r.handle;
      statements.push(
        db.prepare(
          `UPDATE accounts SET handle = ?, name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url)
           WHERE handle = ?`,
        ).bind(handle, r.name ?? null, r.avatarUrl ?? null, r.handle),
        db.prepare(
          `INSERT INTO snapshots (handle, day, followers, checked_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(handle, day) DO UPDATE SET followers = excluded.followers, checked_at = excluded.checked_at`,
        ).bind(handle, day, r.followers!, checkedAt),
      );
    } else {
      statements.push(db.prepare(`UPDATE accounts SET status = ? WHERE handle = ?`).bind(r.status, r.handle));
    }
  }
  if (statements.length) await db.batch(statements);
  return { saved: readings.length, day };
}

/* ------------------------------------------------------------------ */

interface AccountRow {
  handle: string;
  name: string | null;
  avatar_url: string | null;
  joined_at: string;
  signup_followers: number | null;
}
interface SnapshotRow {
  handle: string;
  day: string;
  followers: number;
  checked_at: string;
}

const HISTORY_POINTS = 8;
const BASELINE_LOOKBACK_DAYS = 30; // how far back to look for a week's starting reading

/** Last snapshot on or before `day`. `series` is sorted oldest first. */
function atOrBefore(series: SnapshotRow[], day: string): SnapshotRow | undefined {
  for (let i = series.length - 1; i >= 0; i--) if (series[i].day <= day) return series[i];
  return undefined;
}

/** "Today": latest reading on or before `asOf` minus the reading before it. */
function dayGain(series: SnapshotRow[], asOf: string) {
  const end = atOrBefore(series, asOf);
  if (!end) return null;
  const base = atOrBefore(series, addDays(end.day, -1));
  if (!base) return null;
  return { gain: end.followers - base.followers, end, base, late: false };
}

/**
 * A week's gain as of `asOf` (a day inside the week):
 *   end  = latest reading on or before `asOf`, which must fall inside the week
 *   base = the closing reading of the Sunday before the week (or the last one before it);
 *          for someone who joined during the week, the closing reading of the day they
 *          joined, so their count starts at the following midnight ("late start")
 * Returns null when there's no reading inside the week after the base yet.
 */
function weekGain(series: SnapshotRow[], weekStart: string, asOf: string) {
  const end = atOrBefore(series, asOf);
  if (!end || end.day < weekStart) return null;
  const base = atOrBefore(series, addDays(weekStart, -1)) ?? series.find((s) => s.day >= weekStart);
  if (!base || base.day >= end.day) return null;
  return { gain: end.followers - base.followers, end, base, late: base.day >= weekStart };
}

function rankMap(gains: Array<{ handle: string; gain: number; followers: number }>) {
  const sorted = [...gains].sort((a, b) => b.gain - a.gain || b.followers - a.followers);
  return new Map(sorted.map((g, i) => [g.handle.toLowerCase(), i + 1]));
}

/**
 * period "day":  today's ranking (since midnight).
 * period "week": the given week's ranking (default: the current week). A past week
 *                is computed the same way from its saved readings, so it's an archive.
 */
export async function buildLeaderboard(
  db: D1Database,
  period: LeaderboardPeriod,
  requestedWeek?: number,
): Promise<LeaderboardResponse> {
  await ensureSchema(db);
  const now = new Date();
  const today = nyDay(now);
  const currentWeek = weekOf(today);
  const weekNumber = period === "week" ? Math.min(Math.max(1, requestedWeek ?? currentWeek), currentWeek) : currentWeek;
  const isCurrent = weekNumber === currentWeek;
  const { start: weekStart, end: weekEnd } = weekRange(weekNumber);
  const lastDay = isCurrent ? today : weekEnd; // nothing after this day counts

  const accounts = (
    await db
      .prepare(
        `SELECT a.handle, a.name, a.avatar_url, a.joined_at, p.followers AS signup_followers
         FROM accounts a LEFT JOIN signup_profiles p ON p.handle = a.handle
         WHERE a.status = 'active' ORDER BY a.joined_at`,
      )
      .all<AccountRow>()
  ).results;

  const firstDay = period === "week" ? addDays(weekStart, -BASELINE_LOOKBACK_DAYS) : addDays(today, -HISTORY_POINTS - 2);
  const snapshots = (
    await db
      .prepare(`SELECT handle, day, followers, checked_at FROM snapshots WHERE day >= ? AND day <= ? ORDER BY day`)
      .bind(firstDay, lastDay)
      .all<SnapshotRow>()
  ).results;
  const latestDay = snapshots.length ? snapshots[snapshots.length - 1].day : null;

  const byHandle = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const key = s.handle.toLowerCase();
    (byHandle.get(key) ?? byHandle.set(key, []).get(key)!).push(s);
  }

  const gainOf = (series: SnapshotRow[], asOf: string) =>
    period === "week" ? weekGain(series, weekStart, asOf) : dayGain(series, asOf);
  // Rank movement compares with the day before; on a week's first day there's nothing to compare.
  const previousDay = latestDay ? addDays(latestDay, -1) : null;
  const comparePrevious = previousDay !== null && (period === "day" || previousDay >= weekStart);

  const ranked: Array<{ account: AccountRow; series: SnapshotRow[]; g: NonNullable<ReturnType<typeof gainOf>> }> = [];
  const pending: PendingAccount[] = [];
  const previous: Array<{ handle: string; gain: number; followers: number }> = [];

  for (const account of accounts) {
    const series = byHandle.get(account.handle.toLowerCase()) ?? [];
    const g = latestDay ? gainOf(series, latestDay) : null;
    if (!g) {
      // Past weeks only list who took part; waiting lists belong to the current week.
      if (isCurrent) {
        pending.push({
          handle: account.handle,
          name: account.name,
          avatarUrl: account.avatar_url,
          joinedAt: account.joined_at,
          signupFollowers: account.signup_followers ?? series[series.length - 1]?.followers ?? null,
        });
      }
      continue;
    }
    ranked.push({ account, series, g });
    if (comparePrevious) {
      const prev = gainOf(series, previousDay!);
      if (prev) previous.push({ handle: account.handle, gain: prev.gain, followers: prev.end.followers });
    }
  }

  const currentRanks = rankMap(ranked.map((r) => ({ handle: r.account.handle, gain: r.g.gain, followers: r.g.end.followers })));
  const previousRanks = rankMap(previous);

  const entries: LeaderboardEntry[] = ranked
    .map(({ account, series, g }) => {
      const key = account.handle.toLowerCase();
      // Week view: the trend runs from the starting reading to now. Day view: the last 8 days.
      const trend =
        period === "week"
          ? series.filter((s) => s.day >= g.base.day && s.day <= g.end.day)
          : series.filter((s) => s.day <= g.end.day).slice(-HISTORY_POINTS);
      return {
        rank: currentRanks.get(key)!,
        previousRank: comparePrevious ? (previousRanks.get(key) ?? null) : null,
        handle: account.handle,
        name: account.name ?? account.handle,
        avatarUrl: account.avatar_url,
        followers: g.end.followers,
        startFollowers: g.base.followers,
        gain: g.gain,
        history: trend.map((s) => s.followers),
        joinedAt: account.joined_at,
        lateStart: g.late,
        startDay: g.late ? addDays(g.base.day, 1) : null,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  const updatedAt = latestDay
    ? (snapshots.filter((s) => s.day === latestDay).map((s) => s.checked_at).sort().pop() ?? null)
    : null;

  return {
    period,
    week: {
      number: weekNumber,
      start: weekStart,
      end: weekEnd,
      isCurrent,
      currentNumber: currentWeek,
      endsAt: nextNyMidnightOn(addDays(weekRange(currentWeek).end, 1)).toISOString(),
    },
    updatedAt,
    rankingsOpenAt: nextNyMidnight(now).toISOString(),
    totalParticipants: isCurrent ? accounts.length : entries.length,
    totalGain: entries.reduce((sum, e) => sum + e.gain, 0),
    entries,
    pending,
    demo: false,
  };
}
