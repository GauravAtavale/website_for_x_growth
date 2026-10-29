# website_for_x_growth

**Growth Studio** — a free, browser-based editor for screenshots, mockups, and social graphics, running on
**Cloudflare Workers** via the official [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare).

By [Gaurav Atavale](https://github.com/GauravAtavale) · [@GauravAtavale on X](https://x.com/GauravAtavale)

## Deploy to Cloudflare (no terminal needed)

1. Push this repo to GitHub (already done if you're reading this there).
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Import a repository** and pick this repo.
3. Use these build settings:
   - **Build command:** `npx opennextjs-cloudflare build`
   - **Deploy command:** `npx wrangler deploy`
   - **Node version:** 20 or newer (add a build variable `NODE_VERSION` = `22` if needed)
4. Under **Settings → Variables and secrets**, add `NEXT_PUBLIC_SITE_URL` (e.g. `https://website-for-x-growth.<you>.workers.dev`
   or your custom domain) **both** as a *build variable* and as a runtime *variable*. It drives canonical URLs,
   the sitemap and social-preview tags.
5. Deploy. Every push to `main` redeploys automatically.

The Worker name is set in `wrangler.jsonc` (`website-for-x-growth`). If you rename it, also update the
`services[0].service` value in the same file. A custom domain can be attached under the Worker's
**Settings → Domains & Routes**.

## Deploy from your computer instead

Requires Node.js 20.9+.

```bash
npm ci
npx wrangler login
npm run deploy        # build + deploy to Cloudflare
```

Other commands:

```bash
npm run dev           # Next.js dev server at http://localhost:3000
npm run preview       # build and run on the real Workers runtime at http://localhost:8787
```

For `npm run preview`, copy `.dev.vars.example` to `.dev.vars`.

`npm run dev` can also be opened from other devices on your network (e.g. `http://10.0.0.52:3000`).
Addresses starting `10.`, `192.168.` and `172.` are allowed in `next.config.ts` (`allowedDevOrigins`);
add others there if you use a different network range.

## Optional settings

All are environment variables; leave unset to disable.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your public URL (recommended) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ID (`G-...`) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher ID (`ca-pub-...`), shown only on content pages |
| `NEXT_PUBLIC_VISITS_30D` | Count shown as "8,900+ users" in the header (default in `lib/site-stats.ts`; rounded down) |
| `SCREENSHOT_API_URL` | Screenshot service for "capture a website" (defaults to Microlink's free tier) |

`NEXT_PUBLIC_*` values are baked in at build time, so set them as build variables.

## Notes on running on Cloudflare

- Image export uses the browser's encoder (the server-side `sharp` step can't run on Workers).
- "Capture a website" screenshots aren't cached; each capture goes straight to the screenshot service.
- Analytics and ads are off unless you set your own IDs above.

## License

Apache 2.0 — see [LICENSE](./LICENSE). This is a modified version of an Apache-2.0 open-source project; the
original copyright notice in LICENSE must be kept, as the license requires.
