import type { Metadata } from "next";

// Set NEXT_PUBLIC_SITE_URL (e.g. https://your-domain.com) at build time so
// canonical URLs, sitemap and OG tags point at your own deployment.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

/** Bare host of SITE_URL (e.g. "example.com"), for prose like "go to example.com/editor". */
export const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, "");

export const OG_IMAGE = {
  url: `${SITE_URL}/og.jpg`,
  width: 1200,
  height: 630,
  alt: "Growth Studio - Transform Screenshots into Professional Graphics",
};

export const OG_DEFAULTS = {
  type: "website",
  locale: "en_US",
  siteName: "Growth Studio",
  images: [OG_IMAGE],
} satisfies Metadata["openGraph"];
