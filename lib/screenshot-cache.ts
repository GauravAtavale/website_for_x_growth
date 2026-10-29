/**
 * Screenshot cache — Cloudflare edition.
 *
 * The upstream project caches captured screenshots in PostgreSQL (Prisma) + R2
 * via the AWS SDK. Neither the Prisma classic engine nor the Node-only pieces
 * run on Cloudflare Workers, so this deployment ships without a cache:
 * every capture goes straight to the screenshot service.
 *
 * The exported API is unchanged so the routes that import it keep working.
 * To add caching later, back these functions with a Workers KV or R2 binding.
 */

export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString)
    url.protocol = url.protocol.toLowerCase()
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    if (url.port === '80' && url.protocol === 'http:') url.port = ''
    if (url.port === '443' && url.protocol === 'https:') url.port = ''
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1)
    }
    url.hash = ''
    if (url.search) {
      const sorted = Array.from(new URLSearchParams(url.search).entries()).sort(
        ([a], [b]) => a.localeCompare(b)
      )
      url.search = sorted.length > 0 ? '?' + new URLSearchParams(sorted).toString() : ''
    }
    return url.toString()
  } catch {
    return urlString
  }
}

export async function getCachedScreenshot(
  _url: string,
  _maxAgeMs?: number
): Promise<string | null> {
  return null
}

export async function cacheScreenshot(_url: string, _screenshotBase64: string): Promise<void> {}

export async function invalidateCache(_url: string): Promise<void> {}

export async function invalidateCacheBatch(_urls: string[]): Promise<void> {}

export async function clearOldCache(_maxAgeMs?: number): Promise<void> {}
