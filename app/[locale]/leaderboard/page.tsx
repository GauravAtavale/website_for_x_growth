import { Metadata } from "next";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { LeaderboardApp } from "@/components/leaderboard/LeaderboardApp";
import { OG_DEFAULTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "X Growth Leaderboard - Who Gained the Most Followers Today",
  description:
    "Add your X username and see how many new followers you gain each day compared with other creators. Free, no sign-up, updated daily.",
  keywords: [
    "x growth leaderboard",
    "twitter follower leaderboard",
    "x follower tracker",
    "follower growth ranking",
    "grow on x",
  ],
  openGraph: {
    ...OG_DEFAULTS,
    title: "X Growth Leaderboard - Growth Studio",
    description: "Who gained the most new X followers today? Add your username and find out.",
    url: "/leaderboard",
  },
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation />
      <main className="flex-1 px-4 pb-28 pt-24 sm:px-6 sm:pt-28">
        <LeaderboardApp />
      </main>
      <Footer />
    </div>
  );
}
