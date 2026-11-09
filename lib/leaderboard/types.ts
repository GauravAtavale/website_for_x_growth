/**
 * Shapes shared by the leaderboard page and /api/leaderboard.
 *
 * Ranking rule (v1): one pool for everyone, ranked by raw follower gain.
 *   - "day":  latest daily snapshot minus the snapshot before it
 *   - "week": latest daily snapshot minus the snapshot 7 days earlier
 */

export type LeaderboardPeriod = "day" | "week";

export interface LeaderboardEntry {
  rank: number;
  /** Rank in the previous update for the same period; null if new. */
  previousRank: number | null;
  handle: string;
  name: string;
  avatarUrl: string | null;
  /** Follower count at the latest snapshot. */
  followers: number;
  /** Follower count at the start of the period (the snapshot `gain` is measured from). */
  startFollowers: number;
  /** Followers gained over the period (can be negative). */
  gain: number;
  /** Daily follower counts, oldest first (up to 8 points) for the sparkline. */
  history: number[];
  /** ISO date the handle joined the leaderboard. */
  joinedAt: string;
  /** Week view only: joined after the week began, so their count starts at the
   *  midnight after they joined. `startDay` is that first counted day. */
  lateStart: boolean;
  startDay: string | null;
}

export interface WeekInfo {
  /** The week this response is about (week view), or the current week (day view). */
  number: number;
  /** Monday and Sunday, YYYY-MM-DD (New York). */
  start: string;
  end: string;
  /** True for the week happening now; false for a finished (archived) week. */
  isCurrent: boolean;
  /** The current week's number, so the page can link past weeks. */
  currentNumber: number;
  /** ISO time the current week ends (next Monday midnight in New York). */
  endsAt: string;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  week: WeekInfo;
  /** ISO time of the snapshot the ranking is based on; null before the first update. */
  updatedAt: string | null;
  /** When accounts that joined today get their first ranking: next midnight in New York (ISO). */
  rankingsOpenAt: string;
  totalParticipants: number;
  /** Sum of `gain` across everyone, for the header stat. */
  totalGain: number;
  entries: LeaderboardEntry[];
  /** Joined, but need follower counts from two different days before they can be ranked.
   *  Oldest sign-up first. */
  pending: PendingAccount[];
  /** True while the page is served from sample data instead of real snapshots. */
  demo: boolean;
}

export interface PendingAccount {
  handle: string;
  name: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  /** Follower count when they signed up; null until the sign-up scraper has looked them up. */
  signupFollowers: number | null;
}

export interface JoinResponse {
  ok: boolean;
  handle?: string;
  /** "joined" | "already_joined" */
  status?: string;
  error?: string;
  demo?: boolean;
}

/** X handles: 1-15 letters, digits or underscores. */
export const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/** Accepts "@name", "name", "x.com/name", "https://twitter.com/name". */
export function normalizeHandle(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = /(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})/i.exec(trimmed);
  const candidate = fromUrl ? fromUrl[1] : trimmed.replace(/^@/, "");
  return HANDLE_RE.test(candidate) ? candidate : null;
}
