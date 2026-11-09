"use client";

import { cn } from "@/lib/utils";
import type { PendingAccount } from "@/lib/leaderboard/types";
import { Avatar, nf, useNow } from "./parts";

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 22 -> "22nd" */
function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/** "just now", "12m ago", "3h ago", "2d ago" */
function ago(iso: string, now: number): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function hms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    h: pad(Math.floor(total / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
  };
}

/** Ticking countdown to when rankings open (next midnight in New York). */
function Countdown({ openAt, compact, hourly }: { openAt: string; compact?: boolean; hourly?: boolean }) {
  const now = useNow(1000);
  const left = new Date(openAt).getTime() - now;
  const opened = left <= 0;
  const { h, m, s } = hms(left);
  const openLabel = new Date(openAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (compact) {
    return (
      <span className="text-xs text-muted-foreground">
        {opened ? (
          "Their first ranking is on its way."
        ) : (
          <>
            First ranking in{" "}
            <span className="font-medium tabular-nums text-orange-300">
              {Number(h) > 0 ? `${Number(h)}h ` : ""}
              {Number(m)}m
            </span>
          </>
        )}
      </span>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card px-5 py-6 text-center ring-1 ring-orange-500/25 sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-40 w-[28rem] max-w-full rounded-full bg-[radial-gradient(closest-side,rgba(255,110,60,0.16),transparent)] blur-2xl"
      />
      <p className="relative text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {opened ? "Rankings opening soon" : "Rankings open in"}
      </p>
      {opened ? (
        <p className="relative mt-3 text-sm text-muted-foreground">
          The first update after midnight is on its way. Check back shortly.
        </p>
      ) : (
        <>
          <div
            className="relative mt-3 flex items-baseline justify-center gap-1.5 font-semibold tabular-nums tracking-tight text-foreground"
            role="timer"
            aria-label={`${Number(h)} hours ${Number(m)} minutes until rankings open`}
          >
            {[
              [h, "h"],
              [m, "m"],
              [s, "s"],
            ].map(([value, unit], i) => (
              <span key={unit} className="flex items-baseline">
                {i > 0 && <span className="mr-1.5 text-3xl text-muted-foreground/40 sm:text-4xl">:</span>}
                <span className="text-4xl sm:text-5xl">{value}</span>
                <span className="ml-0.5 text-sm font-medium text-muted-foreground">{unit}</span>
              </span>
            ))}
          </div>
          <p className="relative mt-3 text-sm text-muted-foreground">
            First rankings at {openLabel} ({hourly ? "the next hourly update" : "midnight New York time"}). Until then,
            here&apos;s who you&apos;re up against.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Accounts waiting for their first ranking, in the order they joined.
 *   mode "prelaunch": nobody is ranked yet; big countdown + full competitor list
 *   mode "newcomers": shown under the leaderboard for people who joined recently
 */
export function Competitors({
  accounts,
  openAt,
  myHandle,
  mode,
  joinOrder,
  firstDay = false,
}: {
  accounts: PendingAccount[];
  openAt: string;
  myHandle: string | null;
  mode: "prelaunch" | "newcomers";
  /** First day of the week: newcomers are ranked at the next hourly update, not at midnight. */
  firstDay?: boolean;
  /** Each account's 0-based position among everyone waiting (kept when a search filters the list). */
  joinOrder: number[];
}) {
  const prelaunch = mode === "prelaunch";
  const now = useNow(60_000);
  return (
    <div className={prelaunch ? "" : "mt-10"}>
      {prelaunch && <Countdown openAt={openAt} hourly={firstDay} />}

      <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", prelaunch ? "mt-6" : "")}>
        <h2 className="text-sm font-medium text-foreground">
          {prelaunch ? "Competitors" : "Joined recently"}{" "}
          <span className="font-normal text-muted-foreground">
            · {nf.format(accounts.length)} {prelaunch ? (accounts.length === 1 ? "person" : "people") : "waiting"}
          </span>
        </h2>
        {prelaunch ? (
          <span className="text-xs text-muted-foreground">In the order they joined</span>
        ) : (
          <Countdown openAt={openAt} compact hourly={firstDay} />
        )}
      </div>
      {!prelaunch && (
        <p className="mt-1 text-xs text-muted-foreground">
          {firstDay
            ? "Joined on the first day of the week: counted from when they joined, ranked at the next hourly update."
            : "Joined during the week: counted from the midnight after they join (New York time)."}
        </p>
      )}

      <div className="mt-3 overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-[var(--card-edge-shadow)]">
        <div
          className="grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-muted-foreground/70 sm:grid-cols-[3.5rem_1fr_11rem] sm:px-5"
          aria-hidden="true"
        >
          <span>Joined</span>
          <span>Account</span>
          <span className="whitespace-nowrap text-right">Followers at sign-up</span>
        </div>
        <ol>
          {accounts.map((a, i) => {
            const isMe = myHandle?.toLowerCase() === a.handle.toLowerCase();
            return (
              <li
                key={a.handle}
                id={`lb-${a.handle.toLowerCase()}`}
                className={cn(
                  "border-b border-border/60 last:border-b-0",
                  isMe && "bg-orange-500/[0.06] shadow-[inset_3px_0_0_0_rgb(249,115,22)]",
                )}
              >
                <a
                  href={`https://x.com/${a.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] focus-visible:outline-none sm:grid-cols-[3.5rem_1fr_11rem] sm:px-5"
                >
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {prelaunch ? ordinal(joinOrder[i] + 1) : <span className="text-xs">{ago(a.joinedAt, now)}</span>}
                  </span>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar handle={a.handle} name={a.name ?? a.handle} url={a.avatarUrl} size={36} />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{a.name ?? a.handle}</span>
                        {isMe && (
                          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300 ring-1 ring-inset ring-orange-500/30">
                            You
                          </span>
                        )}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">@{a.handle}</span>
                    </span>
                  </span>
                  <span className="text-right text-sm tabular-nums">
                    {a.signupFollowers === null ? (
                      <span className="text-xs text-muted-foreground/70">Looking up…</span>
                    ) : (
                      <span className="text-foreground/90">{nf.format(a.signupFollowers)}</span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
