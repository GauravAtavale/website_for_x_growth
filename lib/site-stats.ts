/**
 * Live visit count shown in the site header ("1,234 visits").
 *
 * Visits are measured by Cloudflare Web Analytics (cookie-free, bots mostly
 * filtered out) and totalled since LAUNCH_DATE by /api/stats. Nothing here is
 * a made-up number: until the API answers, the header shows no count.
 */

/** Public Web Analytics beacon token (safe to commit: it is visible in page source). */
export const CF_BEACON_TOKEN =
  process.env.NEXT_PUBLIC_CF_BEACON_TOKEN || "984b612482024d248567da5715f215c5";

/** Visits are counted from this moment (UTC). */
export const LAUNCH_DATE = "2026-10-29T00:00:00Z";

/** Word shown after the number in the header pill. */
export const HEADER_COUNT_NOUN = "visits";
