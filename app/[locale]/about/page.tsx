import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { PRODUCT_FACTS, atLeast } from "@/lib/seo/product-facts";
import { TOOLS } from "@/lib/seo/tools";

export const metadata: Metadata = {
  title: { absolute: "About Growth Studio: Free Tools for Growing on X" },
  description:
    "About Growth Studio and its maker, Gaurav Atavale: free, browser-based tools for screenshots, X banners, QR codes, and social graphics.",
  alternates: {
    canonical: "/about",
  },
};

const cardSurface =
  "rounded-2xl bg-card p-4 ring-1 ring-inset ring-border shadow-[var(--card-highlight-shadow)]";

const linkClassName =
  "text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground/60";

const INTER =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const offerings = [
  {
    title: `${atLeast(PRODUCT_FACTS.backgrounds)} Backgrounds`,
    description:
      "Gradient backgrounds, solid colors, and patterns to make your screenshots pop.",
  },
  {
    title: "Browser and Device Mockups",
    description:
      "Safari and Chrome browser frames, window frames, and iPhone, MacBook, and Apple Watch mockups.",
  },
  {
    title: "3D Effects & Animations",
    description:
      "Perspective transforms, shadows, and animation timelines with video export.",
  },
  {
    title: "Tweet, Code, and App Store Editors",
    description:
      "Turn posts and code snippets into shareable images, and lay out App Store screenshots.",
  },
  {
    title: `${TOOLS.length} Image Tools`,
    description:
      "Compress, convert, resize, crop, and rotate images in your browser, without uploading them.",
  },
  {
    title: "Background Remover",
    description:
      "An AI model that runs on your device and returns a full-resolution transparent PNG.",
  },
  {
    title: "X Banner Maker and QR Codes",
    description:
      "A 1500×500 header for your X profile, plus styled QR codes for links, Wi-Fi, contacts, and payments.",
  },
  {
    title: "Share to X",
    description:
      "Send what you make straight to a new post on X, from your phone or your desktop.",
  },
];


export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation />

      <main className="mx-auto max-w-3xl flex-1 px-6 pb-16 pt-28 sm:pb-24">
        <h1
          className="mb-6 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl"
          style={{ fontFamily: INTER }}
        >
          About Growth Studio
        </h1>

        <div className="space-y-8">
          <section>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Growth Studio is a free, open-source studio for the images that
              help you grow on X: polished screenshots, code and post images,
              profile banners, QR codes, and quick image fixes. Everything runs
              in your browser, with no account, no watermark, and no uploads.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold tracking-[-0.02em] text-foreground"
              style={{ fontFamily: INTER }}
            >
              Why I Built This
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Posting on X, writing docs, or launching a project, presentation
              matters, but most tools charge, ask you to sign up, add
              watermarks, or upload your images to their servers. I wanted one
              place that does the job well, respects your privacy, and stays
              free. It reflects something I believe: knowledge and good tools
              should be shared and accessible.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold tracking-[-0.02em] text-foreground"
              style={{ fontFamily: INTER }}
            >
              What You Can Make
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {offerings.map((item) => (
                <div key={item.title} className={cardSurface}>
                  <p className="mb-1 font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold tracking-[-0.02em] text-foreground"
              style={{ fontFamily: INTER }}
            >
              Free, With No Ads
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              There is no paid plan, no watermark, no account, and no
              advertising. Visits are counted with cookie-free analytics, and
              the{" "}
              <Link href="/privacy-policy" className={linkClassName}>
                privacy policy
              </Link>{" "}
              lists exactly what leaves your device. New features are written up
              in the{" "}
              <Link href="/changelog" className={linkClassName}>
                changelog
              </Link>
              .
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold tracking-[-0.02em] text-foreground"
              style={{ fontFamily: INTER }}
            >
              About the Maker
            </h2>
            <p className="mb-3 leading-relaxed text-muted-foreground">
              I&apos;m{" "}
              <Link
                href="https://gauravatavale.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                Gaurav Atavale
              </Link>
              , an AI Research Scientist at American Express AI Labs. I build
              and study systems that reason, plan, and learn from feedback, and
              I learn best by building them from the ground up. My interests are
              generative AI and large language models, RL fine-tuning (PPO, DPO,
              GRPO), and agentic systems that plan and act.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              I write about GenAI, RL, and the research I&apos;m exploring on{" "}
              <Link
                href="https://gauravatavale.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                my blog
              </Link>
              , and I&apos;m always happy to connect with fellow technologists
              and AI enthusiasts on{" "}
              <Link
                href="https://x.com/GauravAtavale"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                X
              </Link>
              ,{" "}
              <Link
                href="https://linkedin.com/in/gauravatavale"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                LinkedIn
              </Link>
              , or{" "}
              <Link
                href="https://github.com/GauravAtavale"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                GitHub
              </Link>
              . If Growth Studio is useful to you, sharing it is the best way to
              help.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
