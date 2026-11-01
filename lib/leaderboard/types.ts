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
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  /** ISO time of the snapshot the ranking is based on; null before the first update. */
  updatedAt: string | null;
  /** ISO time of the next scheduled snapshot. */
  nextUpdateAt: string;
  totalParticipants: number;
  /** Sum of `gain` across everyone, for the header stat. */
  totalGain: number;
  entries: LeaderboardEntry[];
  /** Joined, but need two daily updates before they can be ranked. */
  pending: PendingAccount[];
  /** True while the page is served from sample data instead of real snapshots. */
  demo: boolean;
}

export interface PendingAccount {
  handle: string;
  name: string | null;
  avatarUrl: string | null;
  joinedAt: string;
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
