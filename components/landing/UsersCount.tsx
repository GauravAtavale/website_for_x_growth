"use client";

import { CountUp } from "@/components/ui/CountUp";
import { HEADER_COUNT_NOUN, roundedVisits } from "@/lib/site-stats";
import { cn } from "@/lib/utils";

const format = (value: number) => Math.round(value).toLocaleString("en-US");

/** Header pill in the spot the GitHub star count used to occupy. */
export function UsersCount({ className }: { className?: string }) {
  const count = roundedVisits();
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        // Pill: size, colours and border. Change text-base to text-lg for even bigger text.
        "inline-flex h-10 items-center gap-2.5 rounded-full px-4 text-base tabular-nums",
        "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/35",
        "shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]",
        className,
      )}
      aria-label={`${format(count)}+ ${HEADER_COUNT_NOUN}`}
    >
      {/* Pulsing green "live" dot */}
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-70 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold text-foreground" aria-hidden="true">
        <CountUp from={0} to={count} direction="up" duration={1.4} format={format} />+
      </span>
      <span className="font-medium text-emerald-300/90" aria-hidden="true">
        {HEADER_COUNT_NOUN}
      </span>
    </span>
  );
}
