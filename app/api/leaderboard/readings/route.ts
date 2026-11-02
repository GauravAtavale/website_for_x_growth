import { NextRequest, NextResponse } from "next/server";
import { getDb, listTrackedAccounts, saveReadings } from "@/lib/leaderboard/db";
import { authorizeScraper, noStore, readProfiles } from "@/lib/leaderboard/scraper-api";

export const dynamic = "force-dynamic";

/**
 * Private endpoint for the hourly tracker (scripts/x_hourly_tracker.py).
 * Every request needs:  Authorization: Bearer <LEADERBOARD_SCRAPER_KEY>
 *
 * GET  /api/leaderboard/readings  -> { accounts: [{ handle, lastCheckedAt }] }  every active account
 * POST /api/leaderboard/readings  { readings: [...] } -> { saved, day }
 */

export async function GET(request: NextRequest) {
  const denied = authorizeScraper(request);
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no_database" }, { status: 503 });
  return NextResponse.json({ accounts: await listTrackedAccounts(db) }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const denied = authorizeScraper(request);
  if (denied) return denied;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "no_database" }, { status: 503 });

  const readings = await readProfiles(request, "readings");
  if (readings instanceof NextResponse) return readings;

  try {
    return NextResponse.json(await saveReadings(db, readings), { headers: noStore });
  } catch (err) {
    console.error("leaderboard:readings", err);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
