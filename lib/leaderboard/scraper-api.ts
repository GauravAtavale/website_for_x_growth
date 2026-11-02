import { NextRequest, NextResponse } from "next/server";
import { getScraperKey, type SignupProfile } from "./db";
import { HANDLE_RE } from "./types";

/**
 * Shared by the private scraper endpoints (/api/leaderboard/signups and /readings).
 * Every request needs:  Authorization: Bearer <LEADERBOARD_SCRAPER_KEY>
 */

export const noStore = { "Cache-Control": "no-store" };

/** Returns an error response if the request doesn't carry the scraper key, else null. */
export function authorizeScraper(request: NextRequest): NextResponse | null {
  const key = getScraperKey();
  if (!key) {
    return NextResponse.json(
      { error: "not_configured", hint: "Set the LEADERBOARD_SCRAPER_KEY secret on the Worker (or in .dev.vars locally)." },
      { status: 503 },
    );
  }
  const sent = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (sent.length !== key.length || sent !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

const STATUSES = new Set(["ok", "not_found", "suspended"]);
const AVATAR_RE = /^https:\/\/(pbs|abs)\.twimg\.com\//;

/** Validates one profile reading sent by a scraper. Returns null if it's malformed. */
export function cleanProfile(raw: unknown): SignupProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.handle !== "string" || !HANDLE_RE.test(r.handle)) return null;
  if (typeof r.status !== "string" || !STATUSES.has(r.status)) return null;
  const status = r.status as SignupProfile["status"];
  if (status !== "ok") return { handle: r.handle, status };

  const followers = typeof r.followers === "number" && Number.isFinite(r.followers) ? Math.round(r.followers) : null;
  if (followers === null || followers < 0) return null;
  return {
    handle: r.handle,
    status,
    canonicalHandle:
      typeof r.canonicalHandle === "string" &&
      HANDLE_RE.test(r.canonicalHandle) &&
      r.canonicalHandle.toLowerCase() === r.handle.toLowerCase()
        ? r.canonicalHandle
        : null,
    name: typeof r.name === "string" ? r.name.slice(0, 100) : null,
    avatarUrl: typeof r.avatarUrl === "string" && AVATAR_RE.test(r.avatarUrl) ? r.avatarUrl.slice(0, 500) : null,
    followers,
  };
}

/** Parses `{ [field]: [...] }` (max 200 items) into validated profiles, or returns a 400 response. */
export async function readProfiles(
  request: NextRequest,
  field: "profiles" | "readings",
): Promise<SignupProfile[] | NextResponse> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const list = body?.[field];
  if (!Array.isArray(list) || list.length > 200) {
    return NextResponse.json({ error: `Send { ${field}: [...] } with at most 200 items.` }, { status: 400 });
  }
  const cleaned = list.map(cleanProfile);
  const bad = cleaned.findIndex((p) => p === null);
  if (bad !== -1) return NextResponse.json({ error: `${field}[${bad}] is invalid` }, { status: 400 });
  return cleaned as SignupProfile[];
}
