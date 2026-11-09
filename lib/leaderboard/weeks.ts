/**
 * Leaderboard weeks: Monday to Sunday, New York dates. Week 1 is Nov 2–8, 2026.
 * Days are "YYYY-MM-DD" strings (the same keys the snapshots table uses).
 */

export const FIRST_WEEK_START = "2026-11-02"; // a Monday

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Week number of a day (1 for Nov 2–8, 2026). Days before week 1 count as week 1. */
export function weekOf(day: string): number {
  return Math.max(1, Math.floor(daysBetween(FIRST_WEEK_START, day) / 7) + 1);
}

/** First (Monday) and last (Sunday) day of a week. */
export function weekRange(week: number): { start: string; end: string } {
  const start = addDays(FIRST_WEEK_START, (week - 1) * 7);
  return { start, end: addDays(start, 6) };
}

/** "Nov 9–15", or "Nov 30 – Dec 6" across a month boundary. */
export function formatWeekRange(start: string, end: string): string {
  const fmt = (day: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return sameMonth
    ? `${fmt(start, { month: "short", day: "numeric" })}–${fmt(end, { day: "numeric" })}`
    : `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, { month: "short", day: "numeric" })}`;
}

/** "Wed, Nov 11" */
export function formatDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
