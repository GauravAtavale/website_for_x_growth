/**
 * Upstream uses sharp to detect captures that are one flat colour (sites with
 * intro/fade-in animations). sharp is a native Node module and can't run on
 * Cloudflare Workers, so this check is disabled: every capture is treated as
 * a real image. Never rejecting a capture matches upstream's failure mode.
 */
export async function isBlankImage(_image: Uint8Array | ArrayBuffer): Promise<boolean> {
  return false
}
