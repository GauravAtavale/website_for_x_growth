"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { HEADER_COUNT_NOUN } from "@/lib/site-stats";
import { cn } from "@/lib/utils";

const format = (value: number) => Math.round(value).toLocaleString("en-US");

/** Shared across header instances so client-side navigation doesn't refetch. */
let pending: Promise<number | null> | null = null;
function loadVisits(): Promise<number | null> {
  pending ??= fetch("/api/stats")
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { visits?: unknown } | null) =>
      typeof body?.visits === "number" && Number.isFinite(body.visits) ? body.visits : null,
    )
    .catch(() => null);
  return pending;
}

/** Live visit count in the header, from Cloudflare Web Analytics via /api/stats. */
export function UsersCount({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadVisits().then((n) => alive && setCount(n));
    return () => {
      alive = false;
    };
  }, []);

  // Real numbers only: nothing is shown until the stats API has answered.
  if (count === null) return null;

  return (
    <span
      className={cn(
        // Pill: size, colours and border. Change text-base to text-lg for even bigger text.
        "inline-flex h-10 items-center gap-2.5 rounded-full px-4 text-base tabular-nums",
        "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/35",
        "shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]",
        className,
      )}
      aria-label={`${format(count)} ${HEADER_COUNT_NOUN}`}
      title="Visits since launch, measured by Cloudflare Web Analytics"
    >
      {/* Pulsing green "live" dot */}
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-70 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold text-foreground" aria-hidden="true">
        <CountUp from={0} to={count} direction="up" duration={1.4} format={format} />
      </span>
      <span className="font-medium text-emerald-300/90" aria-hidden="true">
        {HEADER_COUNT_NOUN}
      </span>
    </span>
  );
}
