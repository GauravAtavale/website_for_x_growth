import posthog from 'posthog-js'

// PostHog analytics is optional: set NEXT_PUBLIC_POSTHOG_KEY to enable it.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
if (key) {
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    ui_host: 'https://us.posthog.com',
    defaults: '2026-01-30',
  })
}
