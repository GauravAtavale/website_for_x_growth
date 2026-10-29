import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight01Icon,
  ArrowShrinkIcon,
  CropIcon,
  Image02Icon,
  RotateClockwiseIcon,
  LaptopPhoneSyncIcon,
} from "hugeicons-react";
import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import { CODE_THEME_SOURCES } from "@/components/code-image/code-themes-data";
import { gradientColors } from "@/lib/constants/gradient-colors";
import { SectionTitle } from "@/components/tools/ToolLayout";
import { CARD_CLASS, WindowDots } from "@/components/tools/ui";
import { CHANGELOG } from "@/lib/seo/changelog";
import { HOW_TO_UPDATED, formatGuideDate, guideShortTitle, guides } from "@/lib/seo/guides";
import { OG_DEFAULTS } from "@/lib/seo/metadata";
import {
  IMAGE_FORMATS_SENTENCE,
  PRODUCT_FACTS,
  VIDEO_FORMATS_SENTENCE,
  atLeast,
} from "@/lib/seo/product-facts";
import { TOOLS_HUB_PATH } from "@/lib/seo/tools";
import { DEFAULT_STYLE, renderQrSvg } from "@/lib/qr/render";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Free browser editors for screenshots, code images, tweet images, App Store screenshots, and QR codes, plus image tools that compress, convert, and resize without uploading. No signup, no watermark.";

export const metadata: Metadata = {
  title: "Free Screenshot Editor & Image Tools",
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    ...OG_DEFAULTS,
    title: "Growth Studio - Free Screenshot Editor & Image Tools",
    description: DESCRIPTION,
    url: "/",
  },
};

const INTER =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const CODE_THEME =
  CODE_THEME_SOURCES.find((theme) => theme.id === "midnight") ??
  CODE_THEME_SOURCES[0];
const SYNTAX = CODE_THEME.dark;

const CODE_LINES: [string, string | undefined][][] = [
  [
    ["async function ", SYNTAX.keyword],
    ["fetchUser", SYNTAX.function],
    ["(", SYNTAX.punctuation],
    ["id", SYNTAX.parameter],
    [") {", SYNTAX.punctuation],
  ],
  [
    ["  const ", SYNTAX.keyword],
    ["res ", SYNTAX.foreground],
    ["= ", SYNTAX.punctuation],
    ["await ", SYNTAX.keyword],
    ["fetch", SYNTAX.function],
    ["(", SYNTAX.punctuation],
    ["url", SYNTAX.foreground],
    [");", SYNTAX.punctuation],
  ],
  [
    ["  return ", SYNTAX.keyword],
    ["res", SYNTAX.foreground],
    [".", SYNTAX.punctuation],
    ["json", SYNTAX.function],
    ["();", SYNTAX.punctuation],
  ],
  [["}", SYNTAX.punctuation]],
];

const STORE_HEADLINES = ["Plan your week", "Stay on track", "Share progress"];

function ScreenshotPreview(): React.JSX.Element {
  return (
    <div
      className="flex h-full items-center justify-center px-3 [perspective:900px]"
      style={{ background: gradientColors.orange_pink_dark }}
    >
      <div className="w-[260px] shrink-0 scale-[0.27] overflow-hidden rounded-lg bg-[#fffdf8] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-out [transform:rotateX(8deg)_rotateY(-12deg)_rotateZ(-3deg)] sm:scale-[0.5] md:scale-[0.64] lg:scale-[0.76] motion-safe:group-hover:[transform:rotateX(0deg)_rotateY(0deg)_rotateZ(0deg)] motion-reduce:transition-none">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-neutral-100 px-2.5 py-1.5">
          <WindowDots />
          <span className="flex-1 rounded bg-black/[0.04] py-0.5 text-center text-[7px] text-neutral-500">
            your-next-idea.design
          </span>
        </div>
        <div className="p-4">
          <span className="text-[7px] font-medium tracking-[0.18em] text-neutral-900">STUDIO NOTES</span>
          <p className="mt-2 text-[22px] font-semibold leading-[1.05] tracking-[-0.05em] text-neutral-900">
            Small ideas.<br />Beautiful beginnings.
          </p>
          <div className="mt-3 flex items-end gap-1.5">
            <div className="h-7 flex-1 rounded bg-[#f1bda0]" />
            <div className="h-10 flex-1 rounded bg-[#c2c9ad]" />
            <div className="h-6 flex-1 rounded bg-[#ddd5eb]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConvertPreview(): React.JSX.Element {
  const tile =
    "flex h-[92px] w-[74px] flex-col justify-end rounded-lg bg-white p-2 shadow-[0_18px_36px_-14px_rgba(0,0,0,0.5)]";
  return (
    <div
      className="flex h-full items-center justify-center px-3"
      style={{ background: "linear-gradient(140deg, #a1c4fd, #c2e9fb)" }}
    >
      <div
        className="flex shrink-0 scale-[0.36] items-center gap-3 transition-transform duration-300 ease-out sm:scale-[0.6] md:scale-[0.75] lg:scale-[0.95] motion-reduce:transition-none"
        style={{ fontFamily: INTER }}
      >
        <div className={cn(tile, "-rotate-6 transition-transform duration-300 motion-safe:group-hover:-rotate-3")}>
          <div className="mb-auto h-10 rounded" style={{ background: gradientColors.orange_pink_dark }} />
          <span className="mt-2 rounded bg-sky-600 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">PNG</span>
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-neutral-800 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true">
          →
        </span>
        <div className={cn(tile, "rotate-6 transition-transform duration-300 motion-safe:group-hover:rotate-3")}>
          <div className="mb-auto h-10 rounded" style={{ background: gradientColors.orange_pink_dark }} />
          <span className="mt-2 rounded bg-emerald-600 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">WEBP</span>
        </div>
      </div>
    </div>
  );
}

function RemoveBackgroundPreview(): React.JSX.Element {
  return (
    <div
      className="relative flex h-full items-end justify-center overflow-hidden"
      style={{
        backgroundImage: "repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%)",
        backgroundSize: "14px 14px",
      }}
    >
      {/* Left half keeps the "original" backdrop; the right half shows transparency. */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 transition-[width] duration-500 ease-out motion-safe:group-hover:w-[30%] motion-reduce:transition-none"
        style={{ background: "linear-gradient(160deg, #86efac, #0ea5e9)" }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/80 transition-[left] duration-500 ease-out motion-safe:group-hover:left-[30%] motion-reduce:transition-none" />
      <div className="relative flex flex-col items-center" aria-hidden="true">
        <div className="size-12 rounded-full bg-[#f2c6a0] ring-4 ring-black/10 sm:size-14" />
        <div className="-mt-1 h-12 w-28 rounded-t-[48px] bg-[#7c3aed] sm:h-14 sm:w-32" />
      </div>
    </div>
  );
}

function CompressVideoPreview(): React.JSX.Element {
  return (
    <div
      className="flex h-full items-center justify-center px-3"
      style={{ background: "linear-gradient(140deg, #0f172a, #334155)" }}
    >
      <div className="relative w-[220px] shrink-0 scale-[0.36] transition-transform duration-300 ease-out sm:scale-[0.6] md:scale-[0.75] lg:scale-[0.95] motion-safe:group-hover:-translate-y-1 motion-reduce:transition-none">
        <div className="flex aspect-video items-center justify-center rounded-lg shadow-[0_20px_40px_-14px_rgba(0,0,0,0.6)]" style={{ background: gradientColors.orange_pink_dark }}>
          <span className="flex size-10 items-center justify-center rounded-full bg-white/90 pl-1 text-neutral-900">▶</span>
        </div>
        <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900 shadow-lg" style={{ fontFamily: INTER }}>
          <span className="text-neutral-400 line-through">48 MB</span>
          <span aria-hidden="true">→</span>
          <span className="text-emerald-600">8 MB</span>
        </div>
      </div>
    </div>
  );
}

function CodePreview(): React.JSX.Element {
  return (
    <div
      className="flex h-full items-center justify-center px-3"
      style={{
        background: `linear-gradient(140deg, ${CODE_THEME.from}, ${CODE_THEME.to})`,
      }}
    >
      <div className="shrink-0 scale-[0.3] rounded-lg bg-black/75 p-4 pr-6 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-transform duration-300 ease-out sm:scale-[0.58] md:scale-[0.72] lg:scale-100 motion-safe:group-hover:-translate-y-1 motion-reduce:transition-none">
        <WindowDots />
        <pre className="mt-3 font-[family-name:var(--font-geist-mono)] text-[11px] leading-[18px]">
          {CODE_LINES.map((line, lineIndex) => (
            <div key={lineIndex} className="whitespace-pre">
              <span
                className="mr-3 inline-block w-2 text-right"
                style={{ color: SYNTAX.comment }}
              >
                {lineIndex + 1}
              </span>
              {line.map(([text, color], tokenIndex) => (
                <span key={tokenIndex} style={{ color }}>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function TweetPreview(): React.JSX.Element {
  return (
    <div
      className="flex h-full items-center justify-center px-3"
      style={{ background: "linear-gradient(140deg, #8ec5fc, #4f46e5)" }}
    >
      <div
        className="w-[280px] shrink-0 scale-[0.3] rounded-xl bg-white p-4 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.9] motion-safe:group-hover:-translate-y-1 motion-reduce:transition-none"
        style={{ fontFamily: INTER }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="size-8 shrink-0 rounded-full"
            style={{ background: gradientColors.orange_pink_dark }}
          />
          <div className="min-w-0 flex-1 text-[11px] leading-4">
            <p className="font-semibold text-neutral-900">Growth Studio</p>
            <p className="text-neutral-500">@GauravAtavale</p>
          </div>
          <span className="text-sm font-bold text-neutral-900">𝕏</span>
        </div>
        <p className="mt-3 text-[12px] leading-[18px] text-neutral-900">
          Paste a post link and get a clean image back. Light or dark, any
          background.
        </p>
        <div className="mt-3 flex gap-4 border-t border-black/[0.06] pt-2.5 text-[10px] text-neutral-500">
          <span>1.2K likes</span>
          <span>96 replies</span>
        </div>
      </div>
    </div>
  );
}

function StorePreview(): React.JSX.Element {
  return (
    <div
      className="flex h-full items-center justify-center gap-2 overflow-hidden px-3 sm:items-end sm:gap-3 sm:pt-6"
      style={{ background: gradientColors.store_raycast }}
    >
      {STORE_HEADLINES.map((headline, index) => (
        <div
          key={headline}
          className={cn(
            "-mb-6 flex w-[54px] shrink-0 flex-col items-center gap-2 transition-transform duration-300 ease-out sm:w-[64px] lg:w-[72px] motion-reduce:transition-none",
            index === 1
              ? "-translate-y-3 motion-safe:group-hover:-translate-y-5"
              : "motion-safe:group-hover:-translate-y-1",
          )}
        >
          <p className="text-center text-[9px] font-semibold leading-tight text-white">
            {headline}
          </p>
          <div className="h-[118px] w-full rounded-t-[14px] bg-white p-1.5 pt-2 ring-[3px] ring-black">
            <div className="mx-auto h-1.5 w-6 rounded-full bg-black" />
            <div className="mt-3 space-y-1.5 px-1">
              <div className="h-1.5 w-3/4 rounded-full bg-neutral-800" />
              <div className="h-1 w-full rounded-full bg-neutral-200" />
              <div className="h-1 w-5/6 rounded-full bg-neutral-200" />
              <div className="mt-2 h-8 rounded-md bg-neutral-100" />
              <div className="h-1 w-2/3 rounded-full bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Rendered once at build time; the same renderer powers the QR tool itself. */
const QR_PREVIEW_SVG = renderQrSvg("https://x.com/GauravAtavale", {
  ...DEFAULT_STYLE,
  dotStyle: "rounded",
  eyeFrame: "rounded",
  eyeBall: "circle",
  fg: "#1e1b4b",
  fg2: "#7c3aed",
  margin: 2,
  frame: "label",
  frameColor: "#1e1b4b",
}).svg;

function QrPreview(): React.JSX.Element {
  return (
    <div
      className="flex h-full items-center justify-center px-3"
      style={{ background: "linear-gradient(140deg, #fbc2eb, #a18cd1)" }}
    >
      <div
        className="w-[38%] max-w-[120px] shrink-0 drop-shadow-[0_18px_28px_rgba(30,27,75,0.35)] transition-transform duration-300 ease-out sm:w-[42%] motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-[-2deg] motion-reduce:transition-none [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: QR_PREVIEW_SVG }}
      />
    </div>
  );
}

const CHOICES = [
  {
    href: "/editor",
    title: "Edit a screenshot",
    description: "Backgrounds, frames, and shadows. Export an image or video.",
    action: "Open screenshot editor",
    preview: <ScreenshotPreview />,
  },
  {
    href: "/code",
    title: "Code to image",
    description: "Give your next snippet a theme worth sharing.",
    action: "Create a code image",
    preview: <CodePreview />,
  },
  {
    href: "/tweet",
    title: "Post to image",
    description: "Turn a link from X into a clean, shareable card.",
    action: "Create a post image",
    preview: <TweetPreview />,
  },
  {
    href: "/store-screenshots",
    title: "App Store screenshots",
    description: "Phone frames and layouts for your app.",
    action: "Design your listing",
    preview: <StorePreview />,
  },
  {
    href: "/qr-code-generator",
    title: "QR code",
    description: "Links, Wi-Fi, contacts, and payments, with your logo.",
    action: "Make a QR code",
    preview: <QrPreview />,
  },
  {
    href: "/remove-background",
    title: "Remove background",
    description: "Cut out the subject of any photo in one click.",
    action: "Remove a background",
    preview: <RemoveBackgroundPreview />,
  },
  {
    href: "/compress-video",
    title: "Compress video",
    description: "Shrink a video to the size you need, in your browser.",
    action: "Compress a video",
    preview: <CompressVideoPreview />,
  },
  {
    href: "/convert-image",
    title: "Convert",
    description: "PNG, JPG, WebP, and AVIF, converted in your browser.",
    action: "Convert an image",
    preview: <ConvertPreview />,
  },
];

const QUICK_TOOLS = [
  { href: "/compress-image", label: "Compress", icon: ArrowShrinkIcon },
  { href: "/resize-image", label: "Resize", icon: Image02Icon },
  { href: "/crop-image", label: "Crop", icon: CropIcon },
  { href: "/rotate-image", label: "Rotate", icon: RotateClockwiseIcon },
  { href: "/mockup-generator", label: "Mockup generator", icon: LaptopPhoneSyncIcon },
];

const IMAGE_HANDLING = [
  {
    title: "Edited on your device",
    body: "Images you import are read by your browser and drawn on a canvas in the tab. They are not uploaded to be edited, and drafts are saved in your own browser storage.",
  },
  {
    title: "Image tools without uploads",
    body: "Compress, convert, resize, crop, and rotate run inside the page with the browser's own image APIs, so files go from your disk to your downloads folder without touching a server.",
  },
  {
    title: "Metadata stripped on export",
    body: "Every image is re-encoded from pixels, which drops EXIF data such as the camera model and GPS location before you share it.",
  },
];

const FEATURED_GUIDES = guides.slice(0, 6);
const RECENT_RELEASES = CHANGELOG.slice(0, 3);

const inlineLinkClassName = "text-foreground underline underline-offset-4";

export default function StartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-6xl">
          <section aria-labelledby="create-heading">
            <div className="text-center">
              <h1
                id="create-heading"
                className="text-[32px] font-semibold leading-[1.15] tracking-[-0.035em] text-foreground sm:text-5xl"
                style={{ fontFamily: INTER }}
              >
                What will you create?
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:max-w-none sm:text-base">
                Pick a starting point. Free, no signup, no watermarks.
              </p>
            </div>


            <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {CHOICES.map((choice) => (
                <Link
                  key={choice.href}
                  href={choice.href}
                  className={cn(
                    CARD_CLASS,
                    "group grid min-w-0 grid-cols-[32%_1fr] overflow-hidden p-2 transition-shadow duration-200 hover:ring-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/70 sm:flex sm:flex-col motion-reduce:transition-none",
                  )}
                >
                  <div
                    aria-hidden="true"
                    className="h-32 overflow-hidden rounded-lg sm:h-36 sm:rounded-xl lg:h-40"
                  >
                    {choice.preview}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2 sm:px-3 sm:pb-3 sm:pt-4 lg:px-4">
                    <h2
                      className="text-base font-semibold leading-tight tracking-[-0.02em] text-foreground lg:text-lg"
                      style={{ fontFamily: INTER }}
                    >
                      {choice.title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground/70 sm:text-sm">
                      {choice.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground sm:mt-auto sm:pt-4">
                      {choice.action}
                      <ArrowRight01Icon
                        size={16}
                        className="shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-1 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-border p-4 sm:mt-8 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h2 className="text-sm font-semibold text-foreground">
                  More quick tools
                </h2>
                <Link
                  href={TOOLS_HUB_PATH}
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  All image tools <ArrowRight01Icon size={14} aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_TOOLS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex min-h-11 flex-auto items-center justify-center gap-2 rounded-lg bg-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm motion-reduce:transition-none"
                  >
                    <Icon size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground sm:text-sm">
              A little inspiration?{" "}
              <Link
                href="/landing"
                className="text-foreground underline underline-offset-4"
              >
                See how it works
              </Link>
            </p>
          </section>

          <div className="mx-auto mt-24 flex max-w-3xl flex-col gap-20">
            <section>
              <SectionTitle>A free screenshot editor that runs in your browser</SectionTitle>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Growth Studio turns plain screenshots into images that are
                ready for a landing page, a README, a slide, or a social post.
                Drop in a screenshot, put it on one of{" "}
                {atLeast(PRODUCT_FACTS.backgrounds)} backgrounds, wrap it in a
                Safari or Chrome frame or an iPhone or MacBook mockup, tilt it
                in 3D, and export {IMAGE_FORMATS_SENTENCE} at up to{" "}
                {PRODUCT_FACTS.maxExportScale}x resolution. The same editor
                animates the result and exports {VIDEO_FORMATS_SENTENCE}.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Alongside the main editor there are focused editors for{" "}
                <Link href="/code" className={inlineLinkClassName}>
                  code snippets
                </Link>{" "}
                ({PRODUCT_FACTS.codeThemes} themes and{" "}
                {PRODUCT_FACTS.codeLanguages} languages),{" "}
                <Link href="/tweet" className={inlineLinkClassName}>
                  posts from X
                </Link>
                , and{" "}
                <Link href="/store-screenshots" className={inlineLinkClassName}>
                  App Store screenshots
                </Link>
                , plus quick{" "}
                <Link href={TOOLS_HUB_PATH} className={inlineLinkClassName}>
                  image tools
                </Link>{" "}
                for compressing, converting, resizing, cropping, rotating, and{" "}
                <Link href="/remove-background" className={inlineLinkClassName}>
                  removing backgrounds
                </Link>
                . There is no signup, no watermark, and no paid tier, and the
                whole project is open source under the {PRODUCT_FACTS.license}{" "}
                licence.
              </p>
            </section>

            <section>
              <SectionTitle>What happens to your images</SectionTitle>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {IMAGE_HANDLING.map((item) => (
                  <div key={item.title} className={cn(CARD_CLASS, "p-5")}>
                    <h3 className="text-[15px] font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A few features do need the network, such as capturing a
                screenshot from a URL. The{" "}
                <Link href="/privacy-policy" className={inlineLinkClassName}>
                  privacy policy
                </Link>{" "}
                lists every request that leaves your device.
              </p>
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-4">
                <SectionTitle>Guides</SectionTitle>
                <Link href="/guides" className="text-sm font-medium text-foreground underline underline-offset-4">
                  All guides
                </Link>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Step-by-step guides, written by doing each task in the editor.
                Last checked {formatGuideDate(HOW_TO_UPDATED)}.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {FEATURED_GUIDES.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className={cn(
                        CARD_CLASS,
                        "flex h-full flex-col p-5 transition-shadow duration-200 hover:ring-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/70",
                      )}
                    >
                      <span className="text-[15px] font-semibold text-foreground">
                        {guideShortTitle(guide)}
                      </span>
                      <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {guide.metaDescription}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-4">
                <SectionTitle>Recently shipped</SectionTitle>
                <Link href="/changelog" className="text-sm font-medium text-foreground underline underline-offset-4">
                  Full changelog
                </Link>
              </div>
              <ol className="mt-5 flex flex-col gap-3">
                {RECENT_RELEASES.map((release) => (
                  <li key={release.version} className={cn(CARD_CLASS, "p-5")}>
                    <p className="text-xs text-muted-foreground">
                      v{release.version} · {release.date}
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold text-foreground">
                      {release.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {release.description}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </main>

      <Footer brandName="Growth Studio" />
    </div>
  );
}
