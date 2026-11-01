"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const nf = new Intl.NumberFormat("en-US");

export function formatGain(n: number): string {
  if (n > 0) return `+${nf.format(n)}`;
  if (n < 0) return `−${nf.format(Math.abs(n))}`;
  return "0";
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** "5h 12m", "12m", "under a minute" */
export function formatCountdown(ms: number): string {
  if (ms <= 60_000) return "under a minute";
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Re-renders every `intervalMs` so countdowns stay current. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function hueFor(handle: string): number {
  let h = 0;
  for (const ch of handle.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

export function Avatar({
  handle,
  name,
  url,
  size = 36,
  className,
}: {
  handle: string;
  name: string;
  url: string | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const initials = (name || handle).replace(/[^A-Za-z0-9 ]/g, "").trim().slice(0, 1).toUpperCase() || "@";
  const hue = hueFor(handle);

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-border", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white/90 ring-1 ring-white/10",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 30%))`,
      }}
    >
      {initials}
    </span>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 88;
  const h = 28;
  if (values.length < 2) return <span className={cn("block h-7 w-[88px]", className)} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 4) + 2;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `2,${h} ${line} ${w - 2},${h}`;
  const up = values[values.length - 1] >= values[0];
  const color = up ? "rgb(52 211 153)" : "rgb(251 113 133)";
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2.2} fill={color} />
    </svg>
  );
}

export function RankChange({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  if (previousRank === null) {
    return (
      <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300">
        New
      </span>
    );
  }
  const diff = previousRank - rank;
  if (diff === 0) {
    return (
      <span className="text-xs text-muted-foreground/60" aria-label="No change">
        –
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        up ? "text-emerald-400" : "text-rose-400",
      )}
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(diff)} since last update`}
    >
      <svg viewBox="0 0 10 10" className={cn("size-2.5", !up && "rotate-180")} aria-hidden="true">
        <path d="M5 1.5 9 7.5H1z" fill="currentColor" />
      </svg>
      {Math.abs(diff)}
    </span>
  );
}
