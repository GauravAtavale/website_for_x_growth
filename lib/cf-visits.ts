/**
 * Totals Cloudflare Web Analytics visits for this site since a start date.
 *
 * Needs an API token with "Account Analytics: Read". The account ID and the
 * site's tag are looked up automatically from the token and the public beacon
 * token, or can be pinned with CF_ACCOUNT_ID / CF_WA_SITE_TAG.
 */

const API = "https://api.cloudflare.com/client/v4";
/** Each GraphQL window spans at most this many days (Cloudflare limits query ranges). */
const WINDOW_DAYS = 30;
/** Hard cap on windows per query (about 3 years). */
const MAX_WINDOWS = 36;

type FetchLike = typeof fetch;

export interface VisitsConfig {
  apiToken: string;
  beaconToken: string;
  since: string;
  accountId?: string;
  siteTag?: string;
  now?: Date;
  fetchImpl?: FetchLike;
}

export class StatsError extends Error {}

async function cfJson(f: FetchLike, url: string, token: string, init?: RequestInit) {
  const res = await f(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !body) {
    const msg = (body?.errors as { message?: string }[] | undefined)?.[0]?.message;
    throw new StatsError(`Cloudflare API ${res.status}${msg ? `: ${msg}` : ""}`);
  }
  return body;
}

async function resolveAccountId(f: FetchLike, token: string): Promise<string> {
  const body = await cfJson(f, `${API}/accounts?per_page=5`, token);
  const id = (body.result as { id: string }[] | undefined)?.[0]?.id;
  if (!id) throw new StatsError("No Cloudflare account visible to this token; set CF_ACCOUNT_ID.");
  return id;
}

async function resolveSiteTag(f: FetchLike, token: string, accountId: string, beaconToken: string): Promise<string> {
  const body = await cfJson(f, `${API}/accounts/${accountId}/rum/site_info/list?per_page=100`, token);
  const sites = (body.result as { site_tag: string; site_token: string }[] | undefined) ?? [];
  const site = sites.find((s) => s.site_token === beaconToken);
  if (!site) throw new StatsError("Web Analytics site not found for the beacon token; set CF_WA_SITE_TAG.");
  return site.site_tag;
}

/** Split [since, now] into consecutive windows of at most WINDOW_DAYS. */
export function windows(since: Date, now: Date): [string, string][] {
  const out: [string, string][] = [];
  const step = WINDOW_DAYS * 24 * 3600 * 1000;
  for (let t = since.getTime(); t < now.getTime() && out.length < MAX_WINDOWS; t += step) {
    const end = Math.min(t + step, now.getTime());
    out.push([new Date(t).toISOString(), new Date(end).toISOString()]);
  }
  return out;
}

export async function totalVisitsSince(cfg: VisitsConfig): Promise<number> {
  const f = cfg.fetchImpl ?? fetch;
  const now = cfg.now ?? new Date();
  const since = new Date(cfg.since);
  if (Number.isNaN(since.getTime())) throw new StatsError("Invalid launch date");
  if (since >= now) return 0;

  const accountId = cfg.accountId || (await resolveAccountId(f, cfg.apiToken));
  const siteTag = cfg.siteTag || (await resolveSiteTag(f, cfg.apiToken, accountId, cfg.beaconToken));

  const parts = windows(since, now).map(
    ([from, to], i) => {
      // Inclusive end, 1 ms before the next window starts, so no visit is counted twice.
      const last = new Date(new Date(to).getTime() - 1).toISOString();
      return `w${i}: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { AND: [{ datetime_geq: "${from}", datetime_leq: "${last}" }, { siteTag: $site }] }) { sum { visits } }`;
    },
  );
  const query = `query Visits($account: string!, $site: string!) { viewer { accounts(filter: { accountTag: $account }) { ${parts.join(" ")} } } }`;

  const body = await cfJson(f, `${API}/graphql`, cfg.apiToken, {
    method: "POST",
    body: JSON.stringify({ query, variables: { account: accountId, site: siteTag } }),
  });
  const errors = body.errors as { message?: string }[] | null | undefined;
  if (errors?.length) throw new StatsError(`Cloudflare GraphQL: ${errors[0]?.message ?? "error"}`);

  const account = (body.data as { viewer?: { accounts?: Record<string, { sum?: { visits?: number } }[]>[] } })
    ?.viewer?.accounts?.[0];
  if (!account) throw new StatsError("No analytics returned for this account");
  return Object.values(account).reduce((total, groups) => total + (groups?.[0]?.sum?.visits ?? 0), 0);
}
