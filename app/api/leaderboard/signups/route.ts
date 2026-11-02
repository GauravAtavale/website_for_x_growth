import { NextRequest, NextResponse } from "next/server";
import { getDb, listNewSignups, saveSignupProfiles } from "@/lib/leaderboard/db";
import { authorizeScraper, noStore, readProfiles } from "@/lib/leaderboard/scraper-api";

export const dynamic = "force-dynamic";

/**
 * Private endpoint for the sign-up scraper (scripts/x_signup_scraper.py).
 * Every request needs:  Authorization: Bearer <LEADERBOARD_SCRAPER_KEY>
 *
 * GET  /api/leaderboard/signups  -> { accounts: [{ handle, joinedAt }] }  not yet looked at
 * POST /api/leaderboard/signups  { profiles: [...] } -> { saved, day }
 */

export async function GET(request: NextRequest) {
  const denied = authorizeScraper(request);
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no_database" }, { status: 503 });
  return NextResponse.json({ accounts: await listNewSignups(db) }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const denied = authorizeScraper(request);
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const profiles = await readProfiles(request, "profiles");
  if (profiles instanceof NextResponse) return profiles;

  try {
    return NextResponse.json(await saveSignupProfiles(db, profiles), { headers: noStore });
  } catch (err) {
    console.error("leaderboard:signups", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
