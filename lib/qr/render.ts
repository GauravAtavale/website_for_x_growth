/**
 * Styled QR renderer. Encodes a payload with qrcode-generator and draws it as
 * a self-contained SVG string, which is used for the on-page preview, the SVG
 * download, and (rasterised in the browser) the PNG/JPEG/WebP downloads.
 */

import qrcode from "qrcode-generator";

// qrcode-generator's default byte encoder keeps only the low 8 bits of each
// UTF-16 unit, which corrupts accents, Indic scripts and emoji. Encode as UTF-8.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

export type DotStyle = "square" | "rounded" | "dots" | "classy";
export type EyeFrameStyle = "square" | "rounded" | "circle";
export type EyeBallStyle = "square" | "rounded" | "circle";
export type ErrorLevel = "L" | "M" | "Q" | "H";
export type FrameStyle = "none" | "label";

export interface QrLogo {
  /** data: URL of the uploaded image. */
  src: string;
  /** Logo width as a fraction of the code's width (0.12–0.3). */
  size: number;
  /** Draw a background-coloured plate behind the logo. */
  plate: boolean;
}

export interface QrStyle {
  fg: string;
  /** Second colour for a diagonal gradient, or null for a solid colour. */
  fg2: string | null;
  bg: string;
  transparent: boolean;
  /** Colour of the three corner squares, or null to match the dots. */
  eyeColor: string | null;
  dotStyle: DotStyle;
  eyeFrame: EyeFrameStyle;
  eyeBall: EyeBallStyle;
  /** Quiet zone around the code, in modules. Scanners need about 4. */
  margin: number;
  errorLevel: "auto" | ErrorLevel;
  logo: QrLogo | null;
  frame: FrameStyle;
  frameText: string;
  frameColor: string;
}

export const DEFAULT_STYLE: QrStyle = {
  fg: "#111111",
  fg2: null,
  bg: "#ffffff",
  transparent: false,
  eyeColor: null,
  dotStyle: "square",
  eyeFrame: "square",
  eyeBall: "square",
  margin: 4,
  errorLevel: "auto",
  logo: null,
  frame: "none",
  frameText: "SCAN ME",
  frameColor: "#111111",
};

export interface RenderedQr {
  svg: string;
  /** Intrinsic size in SVG user units; scale both by the same factor. */
  width: number;
  height: number;
  moduleCount: number;
  errorLevel: ErrorLevel;
}

export class QrTooLongError extends Error {
  constructor() {
    super("That is too much content for one QR code. Shorten it, or link to a page instead.");
  }
}

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const r = (n: number) => Math.round(n * 1000) / 1000;

export function resolveErrorLevel(style: Pick<QrStyle, "errorLevel" | "logo">): ErrorLevel {
  if (style.errorLevel !== "auto") return style.errorLevel;
  return style.logo ? "H" : "M";
}

export function encode(payload: string, level: ErrorLevel) {
  const qr = qrcode(0, level);
  try {
    qr.addData(payload, "Byte");
    qr.make();
  } catch {
    throw new QrTooLongError();
  }
  return qr;
}

/** A unit square at (x, y) whose four corners are optionally rounded. */
function roundedCell(
  x: number,
  y: number,
  radius: number,
  [tl, tr, br, bl]: [boolean, boolean, boolean, boolean],
): string {
  const k = radius;
  let d = `M${r(x + (tl ? k : 0))} ${r(y)}`;
  d += `H${r(x + 1 - (tr ? k : 0))}`;
  if (tr) d += `A${k} ${k} 0 0 1 ${r(x + 1)} ${r(y + k)}`;
  d += `V${r(y + 1 - (br ? k : 0))}`;
  if (br) d += `A${k} ${k} 0 0 1 ${r(x + 1 - k)} ${r(y + 1)}`;
  d += `H${r(x + (bl ? k : 0))}`;
  if (bl) d += `A${k} ${k} 0 0 1 ${r(x)} ${r(y + 1 - k)}`;
  d += `V${r(y + (tl ? k : 0))}`;
  if (tl) d += `A${k} ${k} 0 0 1 ${r(x + k)} ${r(y)}`;
  return `${d}Z`;
}

function roundedRect(x: number, y: number, w: number, h: number, rad: number): string {
  const k = Math.min(rad, w / 2, h / 2);
  if (k <= 0) return `M${r(x)} ${r(y)}h${r(w)}v${r(h)}h${r(-w)}Z`;
  return (
    `M${r(x + k)} ${r(y)}H${r(x + w - k)}A${r(k)} ${r(k)} 0 0 1 ${r(x + w)} ${r(y + k)}` +
    `V${r(y + h - k)}A${r(k)} ${r(k)} 0 0 1 ${r(x + w - k)} ${r(y + h)}` +
    `H${r(x + k)}A${r(k)} ${r(k)} 0 0 1 ${r(x)} ${r(y + h - k)}` +
    `V${r(y + k)}A${r(k)} ${r(k)} 0 0 1 ${r(x + k)} ${r(y)}Z`
  );
}

function circle(cx: number, cy: number, rad: number): string {
  return `M${r(cx - rad)} ${r(cy)}a${r(rad)} ${r(rad)} 0 1 0 ${r(rad * 2)} 0a${r(rad)} ${r(rad)} 0 1 0 ${r(-rad * 2)} 0Z`;
}

function eyePaths(x: number, y: number, style: QrStyle): { frame: string; ball: string } {
  let frame: string;
  if (style.eyeFrame === "circle") {
    frame = circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
  } else {
    const outer = style.eyeFrame === "rounded" ? 2 : 0;
    const inner = style.eyeFrame === "rounded" ? 1.2 : 0;
    frame = roundedRect(x, y, 7, 7, outer) + roundedRect(x + 1, y + 1, 5, 5, inner);
  }
  let ball: string;
  if (style.eyeBall === "circle") ball = circle(x + 3.5, y + 3.5, 1.5);
  else ball = roundedRect(x + 2, y + 2, 3, 3, style.eyeBall === "rounded" ? 0.9 : 0);
  return { frame, ball };
}

/** Pick black or white text for legibility on a given background colour. */
export function readableTextColor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#111111" : "#ffffff";
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [R, G, B] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Warnings about choices that make a code hard or impossible to scan. */
export function scanWarnings(style: QrStyle): string[] {
  const warnings: string[] = [];
  const bg = style.transparent ? "#ffffff" : style.bg;
  const darkest = [style.fg, style.fg2, style.eyeColor].filter((c): c is string => Boolean(c));
  if (darkest.some((c) => relativeLuminance(c) > relativeLuminance(bg))) {
    warnings.push("The code is lighter than its background. Many phone cameras can't read inverted codes.");
  } else if (darkest.some((c) => contrastRatio(c, bg) < 3)) {
    warnings.push("Low contrast between the code and background may make it hard to scan.");
  }
  if (style.margin < 2) warnings.push("A margin under 2 can stop codes scanning when placed on busy backgrounds.");
  if (style.logo && resolveErrorLevel(style) !== "H" && resolveErrorLevel(style) !== "Q") {
    warnings.push("Use error correction Q or H when adding a logo, or the code may not scan.");
  }
  if (style.transparent) {
    warnings.push("Transparent codes only scan when placed on a light background.");
  }
  return warnings;
}

let idCounter = 0;

export function renderQrSvg(payload: string, style: QrStyle): RenderedQr {
  const level = resolveErrorLevel(style);
  const qr = encode(payload, level);
  const n = qr.getModuleCount();
  const m = Math.max(0, style.margin);
  const side = n + m * 2;
  const id = `qr${(idCounter = (idCounter + 1) % 1e6)}`;

  const inEye = (row: number, col: number) =>
    (row < 7 && col < 7) || (row < 7 && col >= n - 7) || (row >= n - 7 && col < 7);

  // Clear modules under the logo so it sits on a clean plate.
  let logoBox: { x: number; y: number; s: number } | null = null;
  if (style.logo) {
    const s = Math.min(0.3, Math.max(0.12, style.logo.size)) * n;
    logoBox = { x: (n - s) / 2, y: (n - s) / 2, s };
  }
  const covered = (row: number, col: number) => {
    if (!logoBox) return false;
    const pad = 0.5;
    return (
      col + 1 > logoBox.x - pad &&
      col < logoBox.x + logoBox.s + pad &&
      row + 1 > logoBox.y - pad &&
      row < logoBox.y + logoBox.s + pad
    );
  };
  const dark = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < n && col < n && qr.isDark(row, col) && !inEye(row, col) && !covered(row, col);

  let dots = "";
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!dark(row, col)) continue;
      const x = col + m;
      const y = row + m;
      if (style.dotStyle === "dots") {
        dots += circle(x + 0.5, y + 0.5, 0.43);
        continue;
      }
      if (style.dotStyle === "square") {
        dots += `M${x} ${y}h1v1h-1Z`;
        continue;
      }
      const up = dark(row - 1, col);
      const down = dark(row + 1, col);
      const left = dark(row, col - 1);
      const right = dark(row, col + 1);
      const corners: [boolean, boolean, boolean, boolean] = [
        !up && !left,
        !up && !right,
        !down && !right,
        !down && !left,
      ];
      if (style.dotStyle === "classy") {
        corners[1] = false;
        corners[3] = false;
      }
      dots += roundedCell(x, y, 0.5, corners);
    }
  }

  const fill = style.fg2 ? `url(#${id}g)` : style.fg;
  const eyeFill = style.eyeColor ?? fill;
  const defs = style.fg2
    ? `<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${m}" y1="${m}" x2="${m + n}" y2="${m + n}"><stop offset="0" stop-color="${xml(style.fg)}"/><stop offset="1" stop-color="${xml(style.fg2)}"/></linearGradient></defs>`
    : "";

  let eyes = "";
  for (const [ex, ey] of [
    [m, m],
    [m + n - 7, m],
    [m, m + n - 7],
  ]) {
    const { frame, ball } = eyePaths(ex, ey, style);
    eyes += `<path fill-rule="evenodd" fill="${xml(eyeFill)}" d="${frame}"/><path fill="${xml(eyeFill)}" d="${ball}"/>`;
  }

  const plateColor = style.transparent ? "#ffffff" : style.bg;
  let logo = "";
  if (style.logo && logoBox) {
    const { x, y, s } = logoBox;
    if (style.logo.plate) {
      logo += `<path fill="${xml(plateColor)}" d="${roundedRect(x + m - 0.4, y + m - 0.4, s + 0.8, s + 0.8, 1)}"/>`;
    }
    logo += `<image href="${xml(style.logo.src)}" x="${r(x + m)}" y="${r(y + m)}" width="${r(s)}" height="${r(s)}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  // A hairline stroke in the fill colour hides anti-aliasing seams between
  // neighbouring modules when the SVG is rasterised at fractional scales.
  const seam = style.dotStyle === "dots" ? "" : ` stroke="${fill}" stroke-width="0.04" stroke-linejoin="round"`;
  const code =
    `${defs}` +
    (style.transparent ? "" : `<rect width="${side}" height="${side}" fill="${xml(style.bg)}"/>`) +
    `<path fill="${fill}"${seam} d="${dots}"/>${eyes}${logo}`;

  if (style.frame === "label") {
    const b = Math.max(1.2, side * 0.04);
    const labelH = Math.max(5, side * 0.2);
    const W = side + b * 2;
    const H = side + b * 2 + labelH - b * 0.5;
    const textColor = readableTextColor(style.frameColor);
    const fontSize = labelH * 0.46;
    const text = xml(style.frameText.slice(0, 24) || " ");
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(W)} ${r(H)}" width="${r(W)}" height="${r(H)}">` +
      `<path fill="${xml(style.frameColor)}" d="${roundedRect(0, 0, W, H, b * 2)}"/>` +
      `<path fill="${xml(plateColor)}" d="${roundedRect(b, b, side, side, b)}"/>` +
      `<g transform="translate(${r(b)} ${r(b)})">${code}</g>` +
      `<text x="${r(W / 2)}" y="${r(side + b * 2 + (labelH - b * 0.5) / 2)}" fill="${textColor}" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="700" font-size="${r(fontSize)}" letter-spacing="${r(fontSize * 0.08)}" text-anchor="middle" dominant-baseline="central">${text}</text>` +
      `</svg>`;
    return { svg, width: W, height: H, moduleCount: n, errorLevel: level };
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}">${code}</svg>`;
  return { svg, width: side, height: side, moduleCount: n, errorLevel: level };
}

/** Set the SVG's pixel size for download without changing its viewBox. */
export function sizedSvg(rendered: RenderedQr, widthPx: number): string {
  const h = Math.round((rendered.height / rendered.width) * widthPx);
  return rendered.svg.replace(
    /width="[^"]*" height="[^"]*"/,
    `width="${widthPx}" height="${h}"`,
  );
}

export type RasterFormat = "png" | "jpeg" | "webp";

/** Rasterise in the browser. JPEG gets a white backdrop since it has no alpha. */
export async function rasterize(
  rendered: RenderedQr,
  widthPx: number,
  format: RasterFormat,
): Promise<Blob> {
  const heightPx = Math.round((rendered.height / rendered.width) * widthPx);
  const url = URL.createObjectURL(new Blob([sizedSvg(rendered, widthPx)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, widthPx, heightPx);
    }
    ctx.drawImage(img, 0, 0, widthPx, heightPx);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, `image/${format}`, format === "png" ? undefined : 0.95),
    );
    if (!blob) throw new Error(`This browser can't export ${format.toUpperCase()}.`);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
