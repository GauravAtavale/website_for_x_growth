/**
 * Visitor count shown as social proof in the site header ("8,900+ users").
 *
 * Update VISITS_LAST_30_DAYS from your Cloudflare analytics ("Visits · last 30
 * days"), or set NEXT_PUBLIC_VISITS_30D as a build variable to change it
 * without editing code. The figure is always rounded *down*, so the badge
 * never overstates real traffic. Set it to 0 to hide it.
 */
export const VISITS_LAST_30_DAYS = 8917;

export function visitsLast30Days(): number {
  const fromEnv = Number(process.env.NEXT_PUBLIC_VISITS_30D);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : VISITS_LAST_30_DAYS;
}

/** Rounded-down number used by the header pill, e.g. 8917 -> 8900. */
export function roundedVisits(): number {
  const n = visitsLast30Days();
  if (n < 100) return Math.floor(n);
  const step = n < 10_000 ? 100 : 1_000;
  return Math.floor(n / step) * step;
}

/** Word shown after the number in the header pill. */
export const HEADER_COUNT_NOUN = "users";
