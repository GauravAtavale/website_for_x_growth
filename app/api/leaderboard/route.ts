import { NextRequest, NextResponse } from "next/server";
import { demoLeaderboard } from "@/lib/leaderboard/demo-data";
import { buildLeaderboard, getDb, joinAccount } from "@/lib/leaderboard/db";
import { normalizeHandle, type JoinResponse, type LeaderboardPeriod } from "@/lib/leaderboard/types";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET  /api/leaderboard?period=day|week  -> LeaderboardResponse
 *      add &demo=1 to see the sample data instead of the database
 * POST /api/leaderboard  { handle }      -> JoinResponse
 *
 * Reads and writes the LEADERBOARD_DB D1 database. Falls back to sample data
 * only when that binding isn't configured.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const period: LeaderboardPeriod = params.get("period") === "week" ? "week" : "day";
  const db = getDb();

  if (!db || params.get("demo") === "1") {
    return NextResponse.json(demoLeaderboard(period), { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const board = await buildLeaderboard(db, period);
    // Short cache: a new sign-up should show up within a minute.
    return NextResponse.json(board, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch (err) {
    console.error("leaderboard:get", err);
    return NextResponse.json({ error: "Couldn't load the leaderboard." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  if (!checkRateLimit(`leaderboard-join:${ip}`).allowed) {
    return NextResponse.json<JoinResponse>(
      { ok: false, error: "Too many tries. Wait a minute and try again." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as { handle?: unknown } | null;
  const handle = typeof body?.handle === "string" ? normalizeHandle(body.handle) : null;
  if (!handle) {
    return NextResponse.json<JoinResponse>(
      { ok: false, error: "That doesn't look like an X username." },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json<JoinResponse>(
      { ok: false, error: "Sign-ups aren't open yet. Try again soon." },
      { status: 503 },
    );
  }

  try {
    const result = await joinAccount(db, handle);
    return NextResponse.json<JoinResponse>({ ok: true, ...result });
  } catch (err) {
    console.error("leaderboard:join", err);
    return NextResponse.json<JoinResponse>(
      { ok: false, error: "Couldn't add you right now. Try again in a minute." },
      { status: 500 },
    );
  }
}
