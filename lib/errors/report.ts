/**
 * Sends browser errors to /api/client-error, where they're logged for
 * Cloudflare Workers Issues. Deduplicated and capped per page load so a loop
 * of errors can't flood the endpoint.
 */

const MAX_PER_PAGE = 5;
const seen = new Set<string>();

/** Errors that come from browser extensions or harmless browser quirks. */
const IGNORED = [/ResizeObserver loop/i, /chrome-extension:|moz-extension:|safari-extension:/i, /^Script error\.?$/i];

export function reportClientError(
  error: unknown,
  kind: "error" | "unhandledrejection" | "react-boundary" | "global-boundary" = "error",
  digest?: string,
): void {
  if (typeof window === "undefined" || seen.size >= MAX_PER_PAGE) return;
  const err = error instanceof Error ? error : null;
  const message = err?.message ?? (typeof error === "string" ? error : "Unknown error");
  const stack = err?.stack ?? "";
  if (IGNORED.some((re) => re.test(message) || re.test(stack))) return;

  const key = `${kind}:${message}`;
  if (seen.has(key)) return;
  seen.add(key);

  const payload = JSON.stringify({ kind, message, stack, digest, path: window.location.pathname });
  try {
    if (navigator.sendBeacon?.("/api/client-error", new Blob([payload], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  void fetch("/api/client-error", { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
}
