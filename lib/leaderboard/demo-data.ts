import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from "./types";

/**
 * Sample data so the page can be built and reviewed before real snapshots exist.
 * Handles are invented. Remove once the scraper is writing snapshots.
 */

/** Daily snapshot time: 05:00 UTC = midnight in New York (EST). */
export const SNAPSHOT_HOUR_UTC = 5;

const SAMPLE: Array<[handle: string, name: string, base: number, dailyGrowth: number]> = [
  ["shipfast_sara", "Sara Builds", 2_340, 95],
  ["devlog_kai", "Kai | indie dev", 11_820, 140],
  ["growth_with_nina", "Nina", 640, 58],
  ["the_ml_notes", "ML Notes", 48_100, 210],
  ["buildinpublic_raj", "Raj", 3_910, 44],
  ["pixel_pushr", "Pixel Pusher", 920, 37],
  ["data_with_dee", "Dee", 7_400, 66],
  ["ux_tomas", "Tomás", 1_210, 29],
  ["founder_mode_li", "Li Wei", 15_600, 72],
  ["codecraft_ana", "Ana", 380, 31],
  ["solo_saas_ben", "Ben | SaaS", 5_120, 41],
  ["notion_nerd_zo", "Zo", 2_870, 24],
  ["ai_tinkerer", "AI Tinkerer", 22_300, 88],
  ["writes_daily_em", "Em writes", 1_640, 22],
  ["ship_it_omar", "Omar", 460, 19],
  ["frontend_fern", "Fern", 3_300, 27],
  ["quant_kid", "Quant Kid", 9_870, 35],
  ["cozy_coder", "Cozy Coder", 760, 15],
  ["launch_lab_jo", "Jo @ Launch Lab", 4_450, 21],
  ["prompt_pilot", "Prompt Pilot", 1_980, 18],
  ["design_daily_mo", "Mo", 6_230, 23],
  ["rustacean_rin", "Rin", 2_090, 12],
  ["the_pm_journal", "PM Journal", 13_400, 30],
  ["learn_sql_lu", "Lu", 540, 9],
  ["indie_hacker_vy", "Vy", 1_150, 11],
  ["mobile_dev_ash", "Ash", 3_780, 14],
  ["career_notes_jay", "Jay", 820, 7],
  ["opensource_oli", "Oli", 2_560, 8],
  ["startup_stories", "Startup Stories", 31_900, 26],
  ["nocode_nia", "Nia", 410, 4],
];

/** Small deterministic PRNG so the sample looks the same on every request. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nextSnapshotAfter(now: Date): Date {
  const next = new Date(now);
  next.setUTCHours(SNAPSHOT_HOUR_UTC, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export function lastSnapshotBefore(now: Date): Date {
  const next = nextSnapshotAfter(now);
  return new Date(next.getTime() - 86_400_000);
}

/** 9 daily points per account; the last 8 are shown, the extra one gives previous ranks. */
function buildSeries() {
  return SAMPLE.map(([handle, name, base, growth], i) => {
    const rand = mulberry32(i * 7919 + 17);
    const series: number[] = [base];
    for (let d = 1; d < 9; d++) {
      // Mostly positive days with the odd dip, scaled by each account's pace.
      const delta = Math.round(growth * (0.2 + rand() * 1.6) - growth * 0.15 * (rand() < 0.12 ? 6 : 0));
      series.push(Math.max(0, series[d - 1] + delta));
    }
    return { handle, name, series };
  });
}

function gainFor(series: number[], period: LeaderboardPeriod, offset: number): number {
  const end = series.length - 1 - offset;
  const span = period === "day" ? 1 : 7;
  return series[end] - series[Math.max(0, end - span)];
}

function rankBy(gains: Map<string, number>): Map<string, number> {
  const sorted = [...gains.entries()].sort((a, b) => b[1] - a[1]);
  return new Map(sorted.map(([handle], i) => [handle, i + 1]));
}

export function demoLeaderboard(period: LeaderboardPeriod, now = new Date()): LeaderboardResponse {
  const rows = buildSeries();
  const current = new Map(rows.map((r) => [r.handle, gainFor(r.series, period, 0)]));
  const previous = new Map(rows.map((r) => [r.handle, gainFor(r.series, period, 1)]));
  const currentRank = rankBy(current);
  const previousRank = rankBy(previous);
  const updatedAt = lastSnapshotBefore(now);

  const entries: LeaderboardEntry[] = rows
    .map((r, i) => ({
      rank: currentRank.get(r.handle)!,
      // The last two sample accounts "joined" today, so they have no previous rank.
      previousRank: i >= rows.length - 2 ? null : previousRank.get(r.handle)!,
      handle: r.handle,
      name: r.name,
      avatarUrl: null,
      followers: r.series[r.series.length - 1],
      startFollowers: r.series[r.series.length - 1] - current.get(r.handle)!,
      gain: current.get(r.handle)!,
      history: r.series.slice(-8),
      joinedAt: new Date(updatedAt.getTime() - (i % 9) * 86_400_000 * 3).toISOString(),
    }))
    .sort((a, b) => a.rank - b.rank);

  return {
    period,
    updatedAt: updatedAt.toISOString(),
    rankingsOpenAt: nextSnapshotAfter(now).toISOString(),
    totalParticipants: entries.length,
    totalGain: entries.reduce((sum, e) => sum + e.gain, 0),
    entries,
    pending: [],
    demo: true,
  };
}
