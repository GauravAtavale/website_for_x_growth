/**
 * Draws the shareable leaderboard image (1200×675, X's 16:9 size) on a canvas
 * in the browser. Nothing is rendered on the server.
 *
 *   - Viewer is ranked: their rank, gain and photo on the left; top 5 on the right
 *     (plus their own row if they're outside the top 5).
 *   - Viewer isn't ranked: a headline on the left; top 5 on the right.
 */

import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardResponse } from "@/lib/leaderboard/types";

const W = 1200;
const H = 675;
const SCALE = 2; // sharp on retina screens and in X's image viewer

const C = {
  bg: "#0a0a0a",
  card: "#161616",
  border: "#2a2a2a",
  text: "#ededed",
  muted: "#a3a3a3",
  faint: "#6b6b6b",
  green: "#34d399",
  red: "#fb7185",
  coral: "#ff5a5f",
  orange: "#ff8a00",
};

const PERIOD_TEXT: Record<LeaderboardPeriod, string> = { week: "this week", day: "today" };

const nf = new Intl.NumberFormat("en-US");
const gainText = (n: number) => (n > 0 ? `+${nf.format(n)}` : n < 0 ? `−${nf.format(-n)}` : "0");

/* ------------------------------------------------------------------ helpers */

function pageFont(): string {
  try {
    return getComputedStyle(document.body).fontFamily || "Inter, system-ui, sans-serif";
  } catch {
    return "Inter, system-ui, sans-serif";
  }
}

function loadImage(src: string, timeoutMs = 4000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed so the canvas can still be exported
    const timer = setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

/** X photo, straight from X if it allows it, else through the site's image proxy. */
async function loadAvatar(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return (await loadImage(url)) ?? (await loadImage(`/api/image-proxy?url=${encodeURIComponent(url)}`));
}

function hueFor(handle: string): number {
  let h = 0;
  for (const ch of handle.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  entry: { handle: string; name: string },
  x: number,
  y: number,
  size: number,
  font: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    const hue = hueFor(entry.handle);
    const g = ctx.createLinearGradient(x, y, x + size, y + size);
    g.addColorStop(0, `hsl(${hue} 55% 42%)`);
    g.addColorStop(1, `hsl(${(hue + 40) % 360} 60% 30%)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `600 ${Math.round(size * 0.42)}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const letter = (entry.name || entry.handle).replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase() || "@";
    ctx.fillText(letter, x + size / 2, y + size / 2 + 1);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function brandGradient(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, C.coral);
  g.addColorStop(1, C.orange);
  return g;
}

/* ------------------------------------------------------------------ card */

export async function renderShareCard({
  board,
  me,
  period,
  siteLabel,
  periodText,
  eyebrowText,
  archivedWeek,
}: {
  board: LeaderboardResponse;
  me: LeaderboardEntry | null;
  period: LeaderboardPeriod;
  /** Words after "followers", e.g. "this week", "today", "in week 1". */
  periodText?: string;
  /** Text after "X GROWTH LEADERBOARD · ", e.g. "WEEK 2 · NOV 9–15". */
  eyebrowText?: string;
  /** Set for a finished week: the headline becomes "Who grew fastest in Week N?". */
  archivedWeek?: number;
  /** e.g. "growth-studio.gauravatavale.workers.dev/leaderboard" */
  siteLabel: string;
}): Promise<Blob> {
  const font = pageFont();
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts API missing: system font is fine */
  }

  // Five rows on the right: the top 5, or (if the viewer is further down) the top 3, a gap, and the viewer.
  const top = board.entries.slice(0, 5);
  const showMeBelow = me && !top.some((e) => e.handle === me.handle);
  const rows: Array<LeaderboardEntry | "gap"> = showMeBelow ? [...top.slice(0, 3), "gap", me] : top;

  const people = [...new Map([...top, ...(me ? [me] : [])].map((e) => [e.handle, e])).values()];
  const avatars = new Map(
    await Promise.all(people.map(async (e) => [e.handle, await loadAvatar(e.avatarUrl)] as const)),
  );

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  ctx.scale(SCALE, SCALE);

  // Background + warm glow (logo colours)
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(300, -40, 10, 300, -40, 520);
  glow.addColorStop(0, "rgba(255,110,60,0.22)");
  glow.addColorStop(1, "rgba(255,110,60,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const L = 64; // left column x
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Eyebrow
  ctx.font = `600 15px ${font}`;
  const when = periodText ?? PERIOD_TEXT[period];
  const eyebrow = `X GROWTH LEADERBOARD · ${eyebrowText ?? PERIOD_TEXT[period].toUpperCase()}`;
  const ew = ctx.measureText(eyebrow).width;
  roundRect(ctx, L, 60, ew + 52, 34, 17);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(L + 18, 77, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.muted;
  ctx.fillText(eyebrow, L + 32, 82);

  if (me) {
    // Who
    drawAvatar(ctx, avatars.get(me.handle) ?? null, me, L, 140, 84, font);
    ctx.fillStyle = C.text;
    ctx.font = `600 30px ${font}`;
    ctx.fillText(fit(ctx, me.name, 380), L + 104, 178);
    ctx.fillStyle = C.muted;
    ctx.font = `400 21px ${font}`;
    ctx.fillText(fit(ctx, `@${me.handle}`, 380), L + 104, 210);

    // Rank
    ctx.font = `700 150px ${font}`;
    const rankText = `#${me.rank}`;
    const rw = ctx.measureText(rankText).width;
    ctx.fillStyle = brandGradient(ctx, L, L + rw);
    ctx.fillText(rankText, L - 4, 392);
    ctx.fillStyle = C.muted;
    ctx.font = `500 30px ${font}`;
    ctx.fillText(`of ${nf.format(board.entries.length)}`, L + rw + 14, 392);

    // Gain
    ctx.font = `700 46px ${font}`;
    ctx.fillStyle = me.gain >= 0 ? C.green : C.red;
    const g = gainText(me.gain);
    ctx.fillText(g, L, 462);
    const gw = ctx.measureText(g).width;
    ctx.fillStyle = C.muted;
    ctx.font = `500 24px ${font}`;
    ctx.fillText(`followers ${when}`, L + gw + 12, 462);
  } else {
    ctx.fillStyle = C.text;
    ctx.font = `700 64px ${font}`;
    const [line1, line2, line3] = archivedWeek
      ? ["Who grew", "fastest in", `Week ${archivedWeek}?`]
      : ["Who's growing", "fastest on X", "right now?"];
    ctx.fillText(line1, L, 230);
    ctx.fillText(line2, L, 304);
    ctx.font = `700 64px ${font}`;
    const tw = ctx.measureText(line3).width;
    ctx.fillStyle = brandGradient(ctx, L, L + tw);
    ctx.fillText(line3, L, 378);
    ctx.fillStyle = C.muted;
    ctx.font = `400 24px ${font}`;
    ctx.fillText("Ranked by new followers, not by size.", L, 440);
  }

  // Footer: call to action + address
  ctx.fillStyle = C.text;
  ctx.font = `600 22px ${font}`;
  ctx.fillText("Add your @ and see where you rank", L, 576);
  ctx.fillStyle = C.faint;
  ctx.font = `400 19px ${font}`;
  ctx.fillText(siteLabel, L, 610);

  // Right card
  const cx = 610;
  const cy = 60;
  const cw = W - cx - 56;
  const ch = H - cy - 56;
  roundRect(ctx, cx, cy, cw, ch, 22);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = C.faint;
  ctx.font = `600 13px ${font}`;
  ctx.fillText("RANK", cx + 28, cy + 44);
  ctx.fillText("ACCOUNT", cx + 96, cy + 44);
  ctx.textAlign = "right";
  ctx.fillText("FOLLOWERS GAINED", cx + cw - 28, cy + 44);
  ctx.textAlign = "left";

  const rowTop = cy + 64;
  const rowH = (ch - 64 - 12) / 5;
  rows.forEach((row, i) => {
    const y = rowTop + i * rowH;
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 20, y);
      ctx.lineTo(cx + cw - 20, y);
      ctx.stroke();
    }
    if (row === "gap") {
      ctx.fillStyle = C.faint;
      ctx.font = `600 26px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("· · ·", cx + cw / 2, y + rowH / 2 + 8);
      ctx.textAlign = "left";
      return;
    }
    const isMe = me?.handle === row.handle;
    if (isMe) {
      ctx.fillStyle = "rgba(249,115,22,0.10)";
      ctx.fillRect(cx + 1, y + 1, cw - 2, rowH - 2);
      ctx.fillStyle = "rgb(249,115,22)";
      ctx.fillRect(cx + 1, y + 1, 4, rowH - 2);
    }
    const mid = y + rowH / 2;
    ctx.fillStyle = row.rank <= 3 ? C.text : C.muted;
    ctx.font = `700 24px ${font}`;
    ctx.fillText(String(row.rank), cx + 30, mid + 8);

    drawAvatar(ctx, avatars.get(row.handle) ?? null, row, cx + 92, mid - 24, 48, font);

    ctx.fillStyle = C.text;
    ctx.font = `600 21px ${font}`;
    ctx.fillText(fit(ctx, row.name, cw - 330), cx + 156, mid - 3);
    ctx.fillStyle = C.muted;
    ctx.font = `400 17px ${font}`;
    ctx.fillText(fit(ctx, `@${row.handle}`, cw - 330), cx + 156, mid + 21);

    ctx.textAlign = "right";
    ctx.fillStyle = row.gain > 0 ? C.green : row.gain < 0 ? C.red : C.muted;
    ctx.font = `700 26px ${font}`;
    ctx.fillText(gainText(row.gain), cx + cw - 28, mid + 9);
    ctx.textAlign = "left";
  });

  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create the image."))), "image/png");
    } catch {
      reject(new Error("Couldn't create the image."));
    }
  });
}
