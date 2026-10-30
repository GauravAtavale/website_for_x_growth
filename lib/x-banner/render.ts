/**
 * X (Twitter) profile banner renderer. Draws a 1500×500 header onto a canvas;
 * the same function powers the live preview and the download, so what you see
 * is exactly what you get.
 */

export const BANNER_W = 1500;
export const BANNER_H = 500;

export interface GradientPreset {
  id: string;
  label: string;
  angle: number;
  stops: string[];
  /** Light backgrounds get dark text when the text colour is automatic. */
  light?: boolean;
}

export const GRADIENTS: GradientPreset[] = [
  { id: "coral", label: "Coral", angle: 135, stops: ["#f43f5e", "#fb923c"] },
  { id: "sunset", label: "Sunset", angle: 120, stops: ["#ff6432", "#ff0065", "#7b2eff"] },
  { id: "midnight", label: "Midnight", angle: 150, stops: ["#0f172a", "#312e81"] },
  { id: "ocean", label: "Ocean", angle: 135, stops: ["#0c4a6e", "#38bdf8"] },
  { id: "aurora", label: "Aurora", angle: 120, stops: ["#00c9b7", "#4b6cff", "#9c1fd9"] },
  { id: "berry", label: "Berry", angle: 145, stops: ["#831843", "#f472b6"] },
  { id: "graphite", label: "Graphite", angle: 150, stops: ["#18181b", "#3f3f46"] },
  { id: "mint", label: "Mint", angle: 160, stops: ["#d1fae5", "#f8fafc"], light: true },
];

export interface BannerFont {
  id: string;
  label: string;
  /** CSS variable set by next/font in the root layout. */
  cssVar: string;
  fallback: string;
  weight: number;
}

export const FONTS: BannerFont[] = [
  { id: "inter", label: "Inter", cssVar: "--font-inter", fallback: "Inter, Arial, sans-serif", weight: 700 },
  { id: "grotesk", label: "Space Grotesk", cssVar: "--font-space-grotesk", fallback: "Arial, sans-serif", weight: 700 },
  { id: "playfair", label: "Playfair", cssVar: "--font-playfair-display", fallback: "Georgia, serif", weight: 700 },
  { id: "bebas", label: "Bebas Neue", cssVar: "--font-bebas-neue", fallback: "Impact, sans-serif", weight: 400 },
  { id: "mono", label: "JetBrains Mono", cssVar: "--font-jetbrains-mono", fallback: "monospace", weight: 700 },
  { id: "caveat", label: "Caveat", cssVar: "--font-caveat", fallback: "cursive", weight: 700 },
];

export type Background =
  | { kind: "gradient"; preset: string }
  | { kind: "solid"; color: string }
  | { kind: "photo"; dim: number };

export type Pattern = "none" | "dots" | "grid" | "glow";
export type Align = "left" | "center" | "right";

export interface BannerState {
  background: Background;
  pattern: Pattern;
  headline: string;
  subline: string;
  handle: string;
  font: string;
  align: Align;
  /** null = automatic (white on dark, near-black on light). */
  textColor: string | null;
  /** 0.7–1.4 multiplier on all text sizes. */
  textScale: number;
}

export const DEFAULT_BANNER: BannerState = {
  background: { kind: "gradient", preset: "coral" },
  pattern: "dots",
  headline: "Building in public",
  subline: "AI, products, and lessons from shipping",
  handle: "@yourhandle",
  font: "inter",
  align: "center",
  textColor: null,
  textScale: 1,
};

export function fontFamily(font: BannerFont): string {
  if (typeof document === "undefined") return font.fallback;
  const value = getComputedStyle(document.body).getPropertyValue(font.cssVar).trim();
  return value ? `${value}, ${font.fallback}` : font.fallback;
}

export function getFont(id: string): BannerFont {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

export function getGradient(id: string): GradientPreset {
  return GRADIENTS.find((g) => g.id === id) ?? GRADIENTS[0];
}

function hexLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLightBackground(bg: Background): boolean {
  if (bg.kind === "gradient") return Boolean(getGradient(bg.preset).light);
  if (bg.kind === "solid") return hexLuminance(bg.color) > 0.5;
  return false; // photos get a dark overlay
}

export function resolvedTextColor(state: BannerState): string {
  return state.textColor ?? (isLightBackground(state.background) ? "#111111" : "#ffffff");
}

function paintGradient(ctx: CanvasRenderingContext2D, preset: GradientPreset) {
  const rad = ((preset.angle - 90) * Math.PI) / 180;
  const cx = BANNER_W / 2;
  const cy = BANNER_H / 2;
  const half = (Math.abs(BANNER_W * Math.cos(rad)) + Math.abs(BANNER_H * Math.sin(rad))) / 2;
  const g = ctx.createLinearGradient(
    cx - Math.cos(rad) * half,
    cy - Math.sin(rad) * half,
    cx + Math.cos(rad) * half,
    cy + Math.sin(rad) * half,
  );
  preset.stops.forEach((c, i) => g.addColorStop(i / (preset.stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, BANNER_W, BANNER_H);
}

function paintPhoto(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, dim: number) {
  const scale = Math.max(BANNER_W / img.width, BANNER_H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (BANNER_W - w) / 2, (BANNER_H - h) / 2, w, h);
  if (dim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${dim})`;
    ctx.fillRect(0, 0, BANNER_W, BANNER_H);
  }
}

function paintPattern(ctx: CanvasRenderingContext2D, pattern: Pattern, color: string) {
  if (pattern === "none") return;
  ctx.save();
  if (pattern === "dots") {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = color;
    for (let y = 18; y < BANNER_H; y += 34) {
      for (let x = 18; x < BANNER_W; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "grid") {
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= BANNER_W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BANNER_H);
      ctx.stroke();
    }
    for (let y = 20; y <= BANNER_H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BANNER_W, y);
      ctx.stroke();
    }
  } else if (pattern === "glow") {
    for (const [x, y, r] of [
      [1220, 60, 420],
      [260, 470, 360],
    ]) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.28)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, BANNER_W, BANNER_H);
    }
  }
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  // Ellipsize if words remain.
  const used = lines.join(" ").split(/\s+/).length;
  if (used < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

export interface DrawOptions {
  photo?: (CanvasImageSource & { width: number; height: number }) | null;
  /** Draws safe-zone guides; for the on-page preview only, never exports. */
  guides?: boolean;
}

export function drawBanner(ctx: CanvasRenderingContext2D, state: BannerState, opts: DrawOptions = {}) {
  ctx.save();
  ctx.clearRect(0, 0, BANNER_W, BANNER_H);
  const bg = state.background;
  if (bg.kind === "gradient") paintGradient(ctx, getGradient(bg.preset));
  else if (bg.kind === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, BANNER_W, BANNER_H);
  } else if (opts.photo) paintPhoto(ctx, opts.photo, bg.dim);
  else paintGradient(ctx, GRADIENTS[2]);

  const color = resolvedTextColor(state);
  paintPattern(ctx, state.pattern, color);

  // Text block: keep clear of the profile photo (bottom-left) and of the
  // top/bottom strips some screens crop.
  const font = getFont(state.font);
  const family = fontFamily(font);
  const s = Math.min(1.4, Math.max(0.7, state.textScale));
  const padX = 140;
  const maxW = BANNER_W - padX * 2;
  const x = state.align === "left" ? padX + 300 : state.align === "right" ? BANNER_W - padX : BANNER_W / 2;
  const width = state.align === "left" ? maxW - 300 : maxW;

  const blocks: { text: string; size: number; weight: number; alpha: number; maxLines: number; gap: number }[] = [];
  if (state.headline.trim()) blocks.push({ text: state.headline, size: 92 * s, weight: font.weight, alpha: 1, maxLines: 2, gap: 0 });
  if (state.subline.trim()) blocks.push({ text: state.subline, size: 38 * s, weight: 500, alpha: 0.86, maxLines: 2, gap: 22 * s });
  if (state.handle.trim()) blocks.push({ text: state.handle, size: 28 * s, weight: 600, alpha: 0.7, maxLines: 1, gap: 26 * s });

  const laid = blocks.map((b) => {
    ctx.font = `${b.weight} ${b.size}px ${family}`;
    return { ...b, lines: wrapLines(ctx, b.text, width, b.maxLines), lineH: b.size * 1.12 };
  });
  const total = laid.reduce((h, b) => h + b.gap + b.lines.length * b.lineH, 0);
  let y = (BANNER_H - total) / 2 - 10;

  ctx.textAlign = state.align;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  for (const b of laid) {
    y += b.gap;
    ctx.font = `${b.weight} ${b.size}px ${family}`;
    ctx.globalAlpha = b.alpha;
    for (const line of b.lines) {
      ctx.fillText(line, x, y);
      y += b.lineH;
    }
  }
  ctx.globalAlpha = 1;

  if (opts.guides) drawGuides(ctx);
  ctx.restore();
}

/** Approximate areas X covers or crops; preview only. */
function drawGuides(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 0, BANNER_W, 60);
  ctx.fillRect(0, BANNER_H - 60, BANNER_W, 60);
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.arc(230, 500, 175, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "600 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Profile photo", 230, 400);
  ctx.textAlign = "left";
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText("May be cropped on some screens", 16, 30);
  ctx.restore();
}

export async function bannerBlob(
  state: BannerState,
  photo: DrawOptions["photo"],
  type: "image/png" | "image/jpeg" = "image/png",
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = BANNER_W;
  canvas.height = BANNER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  await ensureFont(state.font);
  drawBanner(ctx, state, { photo, guides: false });
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), type, type === "image/jpeg" ? 0.95 : undefined),
  );
}

/** Waits until the chosen web font is ready, so canvas text isn't drawn in a fallback. */
export async function ensureFont(id: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const font = getFont(id);
  const family = fontFamily(font);
  try {
    await Promise.all([
      document.fonts.load(`${font.weight} 92px ${family}`),
      document.fonts.load(`500 38px ${family}`),
      document.fonts.load(`600 28px ${family}`),
    ]);
  } catch {
    // Fallback fonts still render.
  }
}
