export interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  description: string;
  changes: {
    type: "added" | "improved" | "fixed";
    text: string;
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "October 30, 2026",
    version: "1.1.0",
    title: "X Banner Maker and Share to X",
    description:
      "Design a 1500×500 header for your X profile, and share anything you make straight to X.",
    changes: [
      { type: "added", text: "X Banner Maker at /x-banner-maker with gradient, colour, or photo backgrounds and a profile-photo safe-zone guide" },
      { type: "added", text: "Share to X in the screenshot editor, the QR code generator, and the X Banner Maker" },
      { type: "improved", text: "Live visit count in the header, measured with cookie-free Cloudflare Web Analytics" },
      { type: "fixed", text: "Background remover model now downloads reliably" },
    ],
  },
  {
    date: "October 29, 2026",
    version: "1.0.0",
    title: "Growth Studio launches",
    description:
      "A free, browser-based studio for screenshots, code and post images, App Store screenshots, QR codes, and everyday image tools.",
    changes: [
      { type: "added", text: "Screenshot editor with backgrounds, browser and device frames, 3D effects, and video export" },
      { type: "added", text: "Code to image, post to image, and App Store screenshot editors" },
      { type: "added", text: "QR code generator with 11 content types, custom styles, and logos" },
      { type: "added", text: "Background remover and video compressor that run on your device" },
      { type: "added", text: "Image tools to compress, convert, resize, crop, and rotate" },
    ],
  },
];

export const LATEST_VERSION = CHANGELOG[0].version;

/** ISO date of the most recent shipped change, used for sitemap lastmod and schema dateModified. */
export const LAST_UPDATED_ISO = new Date(`${CHANGELOG[0].date} UTC`)
  .toISOString()
  .split("T")[0];
