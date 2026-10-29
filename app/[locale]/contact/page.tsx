import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { GithubIcon, NewTwitterIcon } from "hugeicons-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Growth Studio team. Report bugs, suggest features, or just say hi.",
  alternates: {
    canonical: "/contact",
  },
};

const cardLinkClassName =
  "group rounded-2xl bg-card p-6 ring-1 ring-inset ring-border shadow-[var(--card-highlight-shadow)] transition-colors hover:bg-foreground/[0.04] hover:ring-ring/40";

const iconWrapClassName =
  "flex size-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-foreground ring-1 ring-inset ring-border";

const linkClassName =
  "text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground/60";

const INTER =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const contacts = [
  {
    href: "https://github.com/GauravAtavale",
    external: true,
    icon: GithubIcon,
    title: "GitHub",
    description:
      "Found a bug or have an idea for a feature? Reach out on GitHub.",
  },
  {
    href: "https://x.com/GauravAtavale",
    external: true,
    icon: NewTwitterIcon,
    title: "Twitter / X",
    description:
      "Follow @GauravAtavale for release notes, tips, and product updates.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation />

      <main className="mx-auto max-w-3xl flex-1 px-6 pb-16 pt-28 sm:pb-24">
        <h1
          className="mb-4 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl"
          style={{ fontFamily: INTER }}
        >
          Contact Us
        </h1>
        <p className="mb-12 text-lg text-muted-foreground">
          Have a question, found a bug, or want to suggest a feature? Here are
          the best ways to reach us.
        </p>

        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {contacts.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              {...(item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={cardLinkClassName}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={iconWrapClassName}>
                  <item.icon size={20} strokeWidth={1.75} />
                </div>
                <h2
                  className="font-semibold tracking-[-0.02em] text-foreground"
                  style={{ fontFamily: INTER }}
                >
                  {item.title}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <section className="mb-8 rounded-2xl bg-card p-6 ring-1 ring-inset ring-border shadow-[var(--card-highlight-shadow)]">
          <h2
            className="mb-2 text-lg font-semibold tracking-[-0.02em] text-foreground"
            style={{ fontFamily: INTER }}
          >
            Before You Reach Out
          </h2>
          <p className="mb-3 leading-relaxed text-muted-foreground">
            Many questions are already answered on the{" "}
            <Link href="/features" className={linkClassName}>
              features
            </Link>{" "}
            page, in the{" "}
            <Link href="/docs" className={linkClassName}>
              API docs
            </Link>
            , or in the{" "}
            <Link href="/changelog" className={linkClassName}>
              changelog
            </Link>
            . Growth Studio is free, needs no account, and processes your
            images in the browser, so there is nothing to cancel and no
            subscription to manage.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            When reporting a bug, include your browser and operating system,
            the steps you took, and a screenshot or exported file if you can.
            Messages on GitHub or X are usually answered within a few days.
          </p>
        </section>

        <section className="rounded-2xl bg-card p-6 ring-1 ring-inset ring-border shadow-[var(--card-highlight-shadow)]">
          <h2
            className="mb-2 text-lg font-semibold tracking-[-0.02em] text-foreground"
            style={{ fontFamily: INTER }}
          >
            Contributing
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Growth Studio is open source. If you&apos;re a developer and
            want to contribute, find me on{" "}
            <Link
              href="https://github.com/GauravAtavale"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              GitHub
            </Link>
            . Pull requests, bug reports, and feature suggestions are all
            welcome.
          </p>
        </section>
      </main>

      <Footer brandName="Growth Studio" />
    </div>
  );
}
