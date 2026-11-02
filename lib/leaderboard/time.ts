/** New York day boundaries. Snapshots are keyed by the New York date. */

const NY = "America/New_York";

/** YYYY-MM-DD in New York. */
export function nyDay(at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(at);
}

/** The next midnight in New York after `at` (handles EST/EDT). */
export function nextNyMidnight(at = new Date()): Date {
  const today = nyDay(at);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const tomorrow = d.toISOString().slice(0, 10);
  // New York midnight is 04:00 UTC (EDT) or 05:00 UTC (EST); pick the one that is.
  for (const hour of [4, 5]) {
    const candidate = new Date(`${tomorrow}T0${hour}:00:00Z`);
    if (nyDay(candidate) === tomorrow && nyDay(new Date(candidate.getTime() - 1)) === today) return candidate;
  }
  return new Date(`${tomorrow}T05:00:00Z`);
}
