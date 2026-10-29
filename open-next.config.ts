import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: no incremental cache binding needed for this site.
// To enable ISR caching later, add an R2 bucket and use r2IncrementalCache.
export default defineCloudflareConfig();
