import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { LeaderboardApp } from "@/components/leaderboard/LeaderboardApp";
import { OG_DEFAULTS } from "@/lib/seo/metadata";
import { nyDay } from "@/lib/leaderboard/time";
import { formatWeekRange, weekOf, weekRange } from "@/lib/leaderboard/weeks";

interface PageProps {
  params: Promise<{ locale: string; week: string }>;
}

/** Only finished weeks have an archive page; the current week lives at /leaderboard. */
function parseWeek(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n < weekOf(nyDay()) ? n : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { week } = await params;
  const n = parseWeek(week);
  if (!n) return {};
  const { start, end } = weekRange(n);
  const title = `X Growth Leaderboard — Week ${n} results (${formatWeekRange(start, end)})`;
  return {
    title,
    description: `Final rankings for week ${n} of the X Growth Leaderboard: who gained the most new X followers.`,
    openGraph: { ...OG_DEFAULTS, title, url: `/leaderboard/week/${n}` },
    alternates: { canonical: `/leaderboard/week/${n}` },
  };
}

export default async function LeaderboardWeekPage({ params }: PageProps) {
  const { week } = await params;
  const n = parseWeek(week);
  if (!n) notFound();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation />
      <main className="flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28">
        <LeaderboardApp archiveWeek={n} />
      </main>
      <Footer />
    </div>
  );
}
