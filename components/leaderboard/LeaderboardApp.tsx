"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  normalizeHandle,
  type JoinResponse,
  type LeaderboardEntry,
  type LeaderboardPeriod,
  type LeaderboardResponse,
  type PendingAccount,
} from "@/lib/leaderboard/types";
import {
  Avatar,
  formatCompact,
  formatGain,
  nf,
  RankChange,
  Sparkline,
} from "./parts";

const MY_HANDLE_KEY = "gs-leaderboard-handle";
const PERIOD_LABEL: Record<LeaderboardPeriod, string> = { day: "today", week: "this week" };

const ctaClassName =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.7)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-gradient-to-r from-[#ff5a5f] to-[#ff8a00]";

function readMyHandle(): string | null {
  try {
    return localStorage.getItem(MY_HANDLE_KEY);
  } catch {
    return null;
  }
}

function saveMyHandle(handle: string) {
  try {
    localStorage.setItem(MY_HANDLE_KEY, handle);
  } catch {
    /* private mode: the page still works, it just won't remember you */
  }
}

/* ------------------------------------------------------------------ */

export function LeaderboardApp() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const [data, setData] = useState<Partial<Record<LeaderboardPeriod, LeaderboardResponse>>>({});
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [myHandle, setMyHandle] = useState<string | null>(null);

  useEffect(() => setMyHandle(readMyHandle()), []);

  useEffect(() => {
    if (data[period]) return;
    let alive = true;
    setError(false);
    fetch(`/api/leaderboard?period=${period}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<LeaderboardResponse>) : Promise.reject()))
      .then((body) => alive && setData((d) => ({ ...d, [period]: body })))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [period, data]);

  const board = data[period];

  const me = useMemo(
    () => board?.entries.find((e) => myHandle && e.handle.toLowerCase() === myHandle.toLowerCase()) ?? null,
    [board, myHandle],
  );

  const filtered = useMemo(() => {
    if (!board) return [];
    const q = query.trim().replace(/^@/, "").toLowerCase();
    if (!q) return board.entries;
    return board.entries.filter(
      (e) => e.handle.toLowerCase().includes(q) || e.name.toLowerCase().includes(q),
    );
  }, [board, query]);


  return (
    <div className="mx-auto w-full max-w-4xl">
      <Hero
        onJoined={(h) => {
          saveMyHandle(h);
          setMyHandle(h);
          setData({}); // refetch so the new account shows up
        }}
        myHandle={myHandle}
        alreadyRanked={Boolean(me)}
      />

      {board?.demo && (
        <p className="mt-8 rounded-lg bg-orange-500/[0.07] px-4 py-2.5 text-center text-[13px] text-orange-200/80 ring-1 ring-inset ring-orange-500/20">
          Preview with sample accounts. Real rankings appear after the first daily update.
        </p>
      )}

      <Stats board={board} period={period} />

      {/* Controls */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          ariaLabel="Ranking period"
          className="sm:w-56"
          value={period}
          onChange={(v) => setPeriod(v as LeaderboardPeriod)}
          options={[
            { id: "week", label: "This week", tooltip: "Followers gained over the last 7 daily updates" },
            { id: "day", label: "Today", tooltip: "Followers gained since the previous daily update" },
          ]}
        />
        <label className="relative sm:w-64">
          <span className="sr-only">Find a username</span>
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M8.5 3a5.5 5.5 0 0 1 4.38 8.82l3.65 3.65a.75.75 0 1 1-1.06 1.06l-3.65-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a username"
            className="h-9 w-full rounded-md bg-foreground/[0.04] pl-9 pr-3 text-sm text-foreground ring-1 ring-inset ring-foreground/10 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-orange-400/50"
          />
        </label>
      </div>

      {/* Board */}
      <section aria-label={`Leaderboard, ${PERIOD_LABEL[period]}`} className="mt-6">
        {error && !board ? (
          <EmptyState
            title="Couldn't load the leaderboard"
            body="Check your connection and refresh the page."
          />
        ) : !board ? (
          <LoadingRows />
        ) : board.entries.length === 0 ? (
          board.pending.length === 0 ? (
            <EmptyState title="No one here yet" body="Add your username above to be the first on the board." />
          ) : (
            <EmptyState
              title="No rankings yet"
              body="Rankings start once there are two daily updates to compare."
            />
          )
        ) : (
          <>
            {filtered.length === 0 ? (
              <EmptyState title={`No match for “${query.trim()}”`} body="Check the spelling, or add that username above." />
            ) : (
              <Table rows={filtered} period={period} myHandle={myHandle} />
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground/70">
              Ranked by net new followers {PERIOD_LABEL[period]} (new follows minus unfollows).
              {board.updatedAt &&
                ` Updated ${new Date(board.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.`}
            </p>
          </>
        )}
        {board && board.pending.length > 0 && !query.trim() && (
          <Pending accounts={board.pending} myHandle={myHandle} />
        )}
      </section>

      {me && board && <MyRankBar entry={me} total={board.totalParticipants} period={period} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hero({
  onJoined,
  myHandle,
  alreadyRanked,
}: {
  onJoined: (handle: string) => void;
  myHandle: string | null;
  alreadyRanked: boolean;
}) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const handle = normalizeHandle(value);
    if (!handle) {
      setState("error");
      setMessage("Enter an X username, like @growthstudio.");
      inputRef.current?.focus();
      return;
    }
    setState("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const body = (await res.json()) as JoinResponse;
      if (!res.ok || !body.ok || !body.handle) throw new Error(body.error ?? "Something went wrong.");
      onJoined(body.handle);
      setState("done");
      setValue("");
      setMessage(
        body.status === "already_joined"
          ? `@${body.handle} is already on the board.`
          : `You're in, @${body.handle}. Your first ranking shows up after the next update.`,
      );
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <header className="relative">
      {/* warm glow behind the title, echoing the logo gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,110,60,0.18),transparent)] blur-2xl"
      />
      <div className="relative flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.05] px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-orange-400 opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
          </span>
          Updated daily
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">
          X Growth{" "}
          <span className="bg-gradient-to-r from-[#ff5a5f] to-[#ff8a00] bg-clip-text text-transparent">
            Leaderboard
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          Add your X username and see how many new followers you gain compared with everyone else.
          Rankings refresh once a day.
        </p>

        <form onSubmit={submit} className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row" noValidate>
          <label className="relative flex-1">
            <span className="sr-only">Your X username</span>
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">
              @
            </span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value.replace(/^@+/, ""));
                if (state === "error") setState("idle");
              }}
              placeholder="username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={state === "error"}
              aria-describedby="join-message"
              className="h-11 w-full rounded-lg bg-card pl-8 pr-3 text-[15px] text-foreground ring-1 ring-inset ring-border outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-orange-400/60 aria-invalid:ring-rose-500/60"
            />
          </label>
          <button type="submit" disabled={state === "busy"} className={ctaClassName}>
            {state === "busy" ? "Adding…" : "Join leaderboard"}
          </button>
        </form>

        <p
          id="join-message"
          role="status"
          className={cn(
            "mt-3 min-h-5 text-sm",
            state === "error" ? "text-rose-400" : state === "done" ? "text-emerald-400" : "text-muted-foreground/70",
          )}
        >
          {message ??
            (myHandle && !alreadyRanked
              ? `Tracking @${myHandle}. You'll appear after the next update.`
              : "No sign-up. Your profile just needs to be public.")}
        </p>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */

function Stats({
  board,
  period,
}: {
  board: LeaderboardResponse | undefined;
  period: LeaderboardPeriod;
}) {
  const tiles = [
    { label: "On the board", value: board ? nf.format(board.totalParticipants) : "—" },
    {
      label: `Followers gained ${PERIOD_LABEL[period]}`,
      value: board && board.entries.length > 0 ? formatGain(board.totalGain) : "—",
      accent: true,
    },
  ];
  return (
    <dl className="mt-8 grid grid-cols-2 gap-2 sm:gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl bg-card px-3 py-3.5 ring-1 ring-border shadow-[var(--card-edge-shadow)] sm:px-5 sm:py-4"
        >
          <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/80 sm:text-xs">
            {t.label}
          </dt>
          <dd
            className={cn(
              "mt-1.5 text-lg font-semibold tabular-nums tracking-tight sm:text-2xl",
              t.accent ? "text-emerald-400" : "text-foreground",
            )}
          >
            {t.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */

function YouChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300 ring-1 ring-inset ring-orange-500/30",
        className,
      )}
    >
      You
    </span>
  );
}

/* ------------------------------------------------------------------ */

function Table({
  rows,
  period,
  myHandle,
}: {
  rows: LeaderboardEntry[];
  period: LeaderboardPeriod;
  myHandle: string | null;
}) {
  const isWeek = period === "week";
  // Week view adds "followers at week start" and the 7-day trend; Today shows neither.
  const cols = cn(
    "grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 sm:px-5",
    isWeek
      ? "sm:grid-cols-[3.5rem_1fr_6.5rem_6.5rem_6.5rem_6.5rem]"
      : "sm:grid-cols-[3.5rem_1fr_7rem_8rem]",
  );
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-[var(--card-edge-shadow)]">
      <div
        className={cn(
          cols,
          "border-b border-border py-2.5 text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-muted-foreground/70",
        )}
        aria-hidden="true"
      >
        <span>Rank</span>
        <span>Account</span>
        {isWeek && <span className="hidden text-right sm:block">Followers at week start</span>}
        <span className="hidden text-right sm:block">{isWeek ? "Followers now" : "Followers"}</span>
        {isWeek && <span className="hidden text-center sm:block">Last 7 days</span>}
        <span className="text-right">{isWeek ? "Followers gained" : "Followers gained today"}</span>
      </div>
      <ol>
        {rows.map((e) => {
          const isMe = myHandle?.toLowerCase() === e.handle.toLowerCase();
          return (
            <li
              key={e.handle}
              id={`lb-${e.handle.toLowerCase()}`}
              className={cn(
                "border-b border-border/60 last:border-b-0",
                isMe && "bg-orange-500/[0.06] shadow-[inset_3px_0_0_0_rgb(249,115,22)]",
              )}
            >
              <a
                href={`https://x.com/${e.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  cols,
                  "py-3 transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] focus-visible:outline-none",
                )}
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{e.rank}</span>
                  <RankChange rank={e.rank} previousRank={e.previousRank} />
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar handle={e.handle} name={e.name} url={e.avatarUrl} size={36} />
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{e.name}</span>
                      {isMe && <YouChip />}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      @{e.handle}
                      <span className="sm:hidden">
                        {" · "}
                        {isWeek
                          ? `${formatCompact(e.startFollowers)} → ${formatCompact(e.followers)}`
                          : formatCompact(e.followers)}
                      </span>
                    </span>
                  </span>
                </span>
                {isWeek && (
                  <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                    {nf.format(e.startFollowers)}
                  </span>
                )}
                <span className="hidden text-right text-sm tabular-nums text-foreground/90 sm:block">
                  {nf.format(e.followers)}
                </span>
                {isWeek && (
                  <span className="hidden justify-center sm:flex">
                    <Sparkline values={e.history} />
                  </span>
                )}
                <span
                  className={cn(
                    "text-right text-base font-semibold tabular-nums",
                    e.gain > 0 ? "text-emerald-400" : e.gain < 0 ? "text-rose-400" : "text-muted-foreground",
                  )}
                  aria-label={`${formatGain(e.gain)} followers ${PERIOD_LABEL[period]}`}
                >
                  {formatGain(e.gain)}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MyRankBar({
  entry,
  total,
  period,
}: {
  entry: LeaderboardEntry;
  total: number;
  period: LeaderboardPeriod;
}) {
  const jump = () => {
    const el = document.getElementById(`lb-${entry.handle.toLowerCase()}`);
    (el ?? document.querySelector("ol"))?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <button
        type="button"
        onClick={jump}
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-popover/90 px-4 py-3 text-left shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] ring-1 ring-orange-500/30 backdrop-blur-md transition-transform hover:-translate-y-0.5"
      >
        <Avatar handle={entry.handle} name={entry.name} url={entry.avatarUrl} size={36} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-muted-foreground">Your rank {PERIOD_LABEL[period]}</span>
          <span className="truncate text-sm font-semibold text-foreground">
            #{entry.rank} <span className="font-normal text-muted-foreground">of {nf.format(total)}</span>
          </span>
        </span>
        <span className={cn("text-lg font-semibold tabular-nums", entry.gain >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {formatGain(entry.gain)}
        </span>
      </button>
    </div>
  );
}

function Pending({ accounts, myHandle }: { accounts: PendingAccount[]; myHandle: string | null }) {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-medium text-foreground">
        Waiting for their first ranking{" "}
        <span className="font-normal text-muted-foreground">· {nf.format(accounts.length)}</span>
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        New accounts are ranked once they have two daily updates to compare.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {accounts.map((a) => {
          const isMe = myHandle?.toLowerCase() === a.handle.toLowerCase();
          return (
            <li key={a.handle}>
              <a
                href={`https://x.com/${a.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-3 text-xs text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground",
                  isMe && "text-orange-200 ring-orange-500/40",
                )}
              >
                <Avatar handle={a.handle} name={a.handle} url={null} size={22} />
                @{a.handle}
                {isMe && <span className="font-semibold uppercase tracking-wide text-orange-300">You</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-border">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5 last:border-b-0">
          <span className="h-4 w-6 animate-pulse rounded bg-foreground/[0.06]" />
          <span className="size-9 animate-pulse rounded-full bg-foreground/[0.06]" />
          <span className="h-4 w-40 animate-pulse rounded bg-foreground/[0.06]" />
          <span className="ml-auto h-4 w-12 animate-pulse rounded bg-foreground/[0.06]" />
        </div>
      ))}
    </div>
  );
}
