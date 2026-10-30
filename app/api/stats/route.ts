import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { StatsError, totalVisitsSince } from "@/lib/cf-visits";
import { CF_BEACON_TOKEN, LAUNCH_DATE } from "@/lib/site-stats";

export const dynamic = "force-dynamic";

/** How long one Cloudflare lookup is reused, in seconds. */
const TTL = 900;
const CACHE_KEY = "https://growth-studio.internal/api/stats/v1";

type Env = Record<string, string | undefined>;

function readEnv(): Env {
  try {
    return { ...(process.env as Env), ...(getCloudflareContext().env as unknown as Env) };
  } catch {
    return process.env as Env;
  }
}

/** Edge cache on Workers; undefined in `next dev`. */
function edgeCache(): Cache | undefined {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default;
}

const json = (body: unknown, status = 200, maxAge = TTL) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": status === 200 ? `public, max-age=${maxAge}` : "no-store" },
  });

export async function GET() {
  const cache = edgeCache();
  const cached = await cache?.match(CACHE_KEY).catch(() => undefined);
  if (cached) return json(await cached.json());

  const env = readEnv();
  if (!env.CF_API_TOKEN) {
    return json({ error: "not_configured", hint: "Add the CF_API_TOKEN secret to the Worker." }, 503);
  }

  try {
    const visits = await totalVisitsSince({
      apiToken: env.CF_API_TOKEN,
      accountId: env.CF_ACCOUNT_ID,
      siteTag: env.CF_WA_SITE_TAG,
      beaconToken: CF_BEACON_TOKEN,
      since: LAUNCH_DATE,
    });
    const body = { visits, since: LAUNCH_DATE, updatedAt: new Date().toISOString() };
    await cache
      ?.put(CACHE_KEY, new Response(JSON.stringify(body), { headers: { "Cache-Control": `max-age=${TTL}` } }))
      .catch(() => undefined);
    return json(body);
  } catch (error) {
    console.error("stats:", error);
    const message = error instanceof StatsError ? error.message : "Unexpected error";
    return json({ error: "upstream_failed", message }, 502);
  }
}
