import { locales } from "@/i18n/routing";

// Your own AdSense publisher ID (ca-pub-...). Leave unset to show no ads.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export const AD_FREE_ROUTES = ["/editor", "/code", "/tweet", "/store-screenshots"];

const AD_FREE_PATH = new RegExp(
  `^(/(${locales.join("|")}))?(${AD_FREE_ROUTES.join("|")})/?$`
);

/** True for editor workspaces, with or without a locale prefix, where ads must never appear. */
export function isAdFreePath(pathname: string): boolean {
  return AD_FREE_PATH.test(pathname);
}

/** AdSense loader for content pages only; editor workspaces and error pages never render it. */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
