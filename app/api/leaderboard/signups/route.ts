import { NextRequest, NextResponse } from "next/server";
import { getDb, getScraperKey, listNewSignups, saveSignupProfiles, type SignupProfile } from "@/lib/leaderboard/db";
import { HANDLE_RE } from "@/lib/leaderboard/types";

export const dynamic = "force-dynamic";

/**
 * Private endpoint for the sign-up scraper (scripts/x_signup_scraper.py).
 * Every request needs:  Authorization: Bearer <LEADERBOARD_SCRAPER_KEY>
 *
 * GET  /api/leaderboard/signups  -> { accounts: [{ handle, joinedAt }] }  not yet looked at
 * POST /api/leaderboard/signups  { profiles: SignupProfile[] } -> { saved, day }
 */

function authorize(request: NextRequest): NextResponse | null {
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

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no_database" }, { status: 503 });
  return NextResponse.json({ accounts: await listNewSignups(db) }, { headers: noStore });
}

const STATUSES = new Set(["ok", "not_found", "suspended"]);
const AVATAR_RE = /^https:\/\/(pbs|abs)\.twimg\.com\//;

function clean(raw: unknown): SignupProfile | null {
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

export async function POST(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { profiles?: unknown } | null;
  if (!Array.isArray(body?.profiles) || body.profiles.length > 200) {
    return NextResponse.json({ error: "Send { profiles: [...] } with at most 200 items." }, { status: 400 });
  }
  const profiles = body.profiles.map(clean);
  const bad = profiles.findIndex((p) => p === null);
  if (bad !== -1) {
    return NextResponse.json({ error: `profiles[${bad}] is invalid` }, { status: 400 });
  }

  try {
    const result = await saveSignupProfiles(db, profiles as SignupProfile[]);
    return NextResponse.json(result, { headers: noStore });
  } catch (err) {
    console.error("leaderboard:signups", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
