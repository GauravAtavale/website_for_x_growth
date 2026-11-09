/** New York day boundaries. Snapshots are keyed by the New York date. */

const NY = "America/New_York";

/** YYYY-MM-DD in New York. */
export function nyDay(at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(at);
}

/** The moment a New York day (YYYY-MM-DD) begins: its midnight (handles EST/EDT). */
export function nyMidnightOn(day: string): Date {
  // New York midnight is 04:00 UTC (EDT) or 05:00 UTC (EST); pick the one that is.
  for (const hour of [4, 5]) {
    const candidate = new Date(`${day}T0${hour}:00:00Z`);
    if (nyDay(candidate) === day && nyDay(new Date(candidate.getTime() - 1)) !== day) return candidate;
  }
  return new Date(`${day}T05:00:00Z`);
}

/** The next midnight in New York after `at`. */
export function nextNyMidnight(at = new Date()): Date {
  const d = new Date(`${nyDay(at)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return nyMidnightOn(d.toISOString().slice(0, 10));
}
