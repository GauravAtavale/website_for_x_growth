import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Growth Studio. What stays on your device, what leaves it, the cookie-free analytics we use, and the services the site relies on.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

const CONTACT_URL = "https://x.com/GauravAtavale";

const linkClassName =
  "text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground/60";

const INTER =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2
        className="mb-3 text-xl font-semibold tracking-[-0.02em] text-foreground"
        style={{ fontFamily: INTER }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClassName}
    >
      {children}
    </Link>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">
      {children}
    </code>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation />

      <main className="mx-auto max-w-3xl flex-1 px-6 pb-16 pt-28 sm:pb-24">
        <h1
          className="mb-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl"
          style={{ fontFamily: INTER }}
        >
          Privacy Policy
        </h1>
        <p className="mb-12 text-sm text-muted-foreground">
          Last updated: October 30, 2026
        </p>

        <div className="max-w-none space-y-8">
          <Section title="Overview">
            <p className="mb-3 leading-relaxed text-muted-foreground">
              Growth Studio is a free, open-source,
              browser-based image editor operated by Gaurav Atavale. There
              is no account, no signup, and no login, so we never ask you for a
              name, an email address, or payment details to use the editor.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Editing, compositing, and preview rendering happen on your device
              in the browser canvas. A few features do send data off your
              device, and we count visits with cookie-free analytics. Each of
              these is described below. There are no ads, and we do not sell or
              share your personal information.
            </p>
          </Section>

          <Section title="What Stays On Your Device">
            <p className="mb-3 leading-relaxed text-muted-foreground">
              Images you import from your device are read in the browser and are
              never uploaded to us for editing. The editor also stores your work
              in your own browser:
            </p>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Drafts:</strong> your
                in-progress canvas is autosaved to IndexedDB and deleted
                automatically after 7 days.
              </li>
              <li>
                <strong className="text-foreground">Images:</strong> imported
                images under 500KB are kept in local storage so a reload does
                not lose them. Larger images are held in memory only.
              </li>
              <li>
                <strong className="text-foreground">Preferences:</strong> aspect
                ratio, export settings, custom presets, theme, and recent
                exports.
              </li>
              <li>
                <strong className="text-foreground">Image tools:</strong> the
                compress, convert, resize, crop, rotate, background removal,
                and video compression tools process files in your browser tab
                and write the result
                straight to your downloads. Re-encoding also drops embedded
                EXIF metadata such as camera details and GPS location.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              None of this reaches our servers. Clearing site data in your
              browser removes all of it.
            </p>
          </Section>

          <Section title="What Leaves Your Device">
            <ul className="list-inside list-disc space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Capturing a screenshot from a URL:
                </strong>{" "}
                the address you enter is sent through our server to{" "}
                <ExternalLink href="https://microlink.io">Microlink</ExternalLink>
                , which loads that public page and captures it. The image is
                returned to your browser; we do not store the screenshot or the
                address.
              </li>
              <li>
                <strong className="text-foreground">Importing a post from X:</strong>{" "}
                the numeric post id is sent to X&apos;s public syndication API to
                fetch the post content that gets rendered on your canvas. Images
                in the post are loaded through our image proxy, which only
                serves images from X&apos;s own image servers.
              </li>
              <li>
                <strong className="text-foreground">
                  Removing a background:
                </strong>{" "}
                the image is processed entirely in your browser and is never
                uploaded. The first time you use it, your browser downloads the
                AI model files through this site (<Code>/hf/…</Code>), which
                fetches them from{" "}
                <ExternalLink href="https://huggingface.co">
                  Hugging Face
                </ExternalLink>{" "}
                on your behalf, and the AI runtime from the jsDelivr CDN. Neither
                receives any image data. The files are then cached in your
                browser.
              </li>
              <li>
                <strong className="text-foreground">Compressing or exporting video:</strong>{" "}
                the video is processed entirely in your browser and is never
                uploaded. The first time, your browser downloads the FFmpeg
                engine from the{" "}
                <ExternalLink href="https://unpkg.com">unpkg</ExternalLink> CDN,
                which receives a standard file request (including your IP
                address) but no video data.
              </li>
              <li>
                <strong className="text-foreground">Sharing to X:</strong> when
                you use &quot;Share to X&quot;, the image goes to X only through
                your own device: your system share sheet, or your clipboard
                plus an X compose window that you choose to post from. Nothing
                is uploaded to us.
              </li>
              <li>
                <strong className="text-foreground">Fonts:</strong> some code
                themes load fonts from Google Fonts, which receives a standard
                file request.
              </li>
              <li>
                <strong className="text-foreground">Error reports:</strong> if
                a page crashes, your browser sends us the error message, the
                page address, and your browser type so we can fix it. Reports
                never include your images or anything you typed.
              </li>
            </ul>
          </Section>

          <Section title="Analytics">
            <p className="leading-relaxed text-muted-foreground">
              We use{" "}
              <ExternalLink href="https://www.cloudflare.com/web-analytics/">
                Cloudflare Web Analytics
              </ExternalLink>{" "}
              to count visits and page views; the total is the visit count shown
              in the site header. It sets no cookies, does not use local
              storage, and does not fingerprint or track you across sites. It
              records the page address, referrer, browser and device type,
              country, and page-load timing, and we only see aggregate numbers.
              Read{" "}
              <ExternalLink href="https://www.cloudflare.com/privacypolicy/">
                Cloudflare&apos;s privacy policy
              </ExternalLink>
              .
            </p>
          </Section>

          <Section title="Hosting and Security">
            <ul className="list-inside list-disc space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Hosting and network:
                </strong>{" "}
                the site runs on Cloudflare Workers. Cloudflare keeps standard
                request logs, which can include IP addresses, for security and
                reliability, and we can view error logs for a limited time to
                fix problems.
              </li>
              <li>
                <strong className="text-foreground">Rate limiting:</strong> the
                screenshot API keeps your IP address in server memory for up to
                60 seconds to enforce its per-minute limit. It is not written to
                a database.
              </li>
            </ul>
          </Section>

          <Section id="cookies" title="Cookies">
            <p className="mb-3 leading-relaxed text-muted-foreground">
              We set one functional cookie ourselves,{" "}
              <Code>growth-studio-store-active</Code>, and only when you
              have an App Store screenshot project open, so the page can restore
              it on your next visit. It holds the value 1 and no identifier.
            </p>
            <p className="mb-3 leading-relaxed text-muted-foreground">
              We do not use advertising or tracking cookies, and our analytics
              are cookie-free.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You can block or delete cookies in your browser settings. The
              editor and image tools keep working without them.
            </p>
          </Section>

          <Section title="Legal Bases">
            <p className="leading-relaxed text-muted-foreground">
              Where data protection laws such as the GDPR apply, we process data
              on these bases: our legitimate interest in keeping the site
              secure, reliable, and improving it, for request logs, error
              reports, rate limiting, and aggregate cookie-free analytics; and
              performance of the service you ask for, when you use URL capture,
              post import, or background removal.
            </p>
          </Section>

          <Section title="Data Retention">
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                Images you edit: never sent to or stored on our servers.
              </li>
              <li>
                URL screenshots: passed straight back to your browser, not
                stored.
              </li>
              <li>
                Rate-limit entries: up to 60 seconds in memory.
              </li>
              <li>
                Analytics and request logs: aggregate data retained by
                Cloudflare under its own retention settings.
              </li>
            </ul>
          </Section>

          <Section title="Your Rights">
            <p className="mb-3 leading-relaxed text-muted-foreground">
              Depending on where you live, you may have the right to access,
              correct, delete, or port your personal data, to object to or
              restrict processing, and to withdraw consent at any time. Because
              we do not run accounts, we usually hold nothing that identifies
              you directly, but we will help with any request we can act on.
            </p>
            <p className="mb-3 leading-relaxed text-muted-foreground">
              California and other US state residents: we do not sell or share
              personal information, and we do not use it for targeted
              advertising.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              To make a request, message us on{" "}
              <ExternalLink href={CONTACT_URL}>X</ExternalLink>
              . You also have the right to complain to your local data
              protection authority.
            </p>
          </Section>

          <Section title="Your Choices">
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                Clear site data in your browser to remove every draft, image,
                and preference stored locally.
              </li>
              <li>
                Block analytics with a content blocker. Every tool works
                without it.
              </li>
              <li>
                Skip URL capture and tweet import if you do not want those
                requests made. Importing images from your device never leaves
                the browser.
              </li>
            </ul>
          </Section>

          <Section title="Children">
            <p className="leading-relaxed text-muted-foreground">
              Growth Studio is not directed at children under 13 (or under
              16 in the EEA and UK), and we do not knowingly collect information
              from them.
            </p>
          </Section>

          <Section title="Open Source">
            <p className="leading-relaxed text-muted-foreground">
              Growth Studio is open source. Every claim on this page about
              how the editor handles your images can be checked against the{" "}
              <ExternalLink href="https://github.com/GauravAtavale">
                source code on GitHub
              </ExternalLink>
              .
            </p>
          </Section>

          <Section title="Changes">
            <p className="leading-relaxed text-muted-foreground">
              We update this policy when the site changes, for example when we
              add or remove a third-party service. Changes are reflected on this
              page with an updated date.
            </p>
          </Section>

          <Section title="Contact">
            <p className="leading-relaxed text-muted-foreground">
              Questions about this policy or your data: message us on{" "}
              <ExternalLink href={CONTACT_URL}>X</ExternalLink>{" "}
              or use our{" "}
              <Link href="/contact" className={linkClassName}>
                contact page
              </Link>
              .
            </p>
          </Section>
        </div>
      </main>

      <Footer brandName="Growth Studio" />
    </div>
  );
}
