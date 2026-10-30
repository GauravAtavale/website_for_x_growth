import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : undefined);

/**
 * Receives errors from visitors' browsers and logs them with console.error so
 * Cloudflare Workers Issues groups them and can alert. Nothing personal is
 * stored: message, stack, page path, and browser type only.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text().catch(() => "");
  if (raw.length > 8_000) return new NextResponse(null, { status: 413 });
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const message = clip(body.message, 500);
  if (!message) return new NextResponse(null, { status: 400 });

  console.error(`[client-error] ${message}`, {
    kind: clip(body.kind, 40),
    path: clip(body.path, 200),
    stack: clip(body.stack, 2_000),
    digest: clip(body.digest, 100),
    userAgent: clip(request.headers.get("user-agent"), 200),
  });
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
}
