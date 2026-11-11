const FETCH_TIMEOUT_MS = 8000;

function extractDomain(websiteUrl: string): string | null {
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Fetch a URL with a timeout, returning the Response or null. */
async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: { "user-agent": "AIAtlas/1.0 (+https://aiatlas.dev)" },
    });
    return res;
  } catch {
    return null;
  }
}

/** Scrape <link rel="... icon ..."> hrefs from the page HTML. */
async function scrapeFaviconLinks(origin: string): Promise<string[]> {
  const res = await safeFetch(origin);
  if (!res || !res.ok) return [];
  const html = (await res.text()).slice(0, 200_000);
  const links: string[] = [];
  const re = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (!/rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      links.push(new URL(href, res.url || origin).toString());
    } catch {
      /* skip invalid href */
    }
  }
  return links;
}

/** Verify a URL actually serves an image before we store it. */
async function isImageUrl(url: string): Promise<boolean> {
  const res = await safeFetch(url, { method: "GET" });
  if (!res || !res.ok) return false;
  const type = res.headers.get("content-type") ?? "";
  return type.startsWith("image/") || type === "image/x-icon" || type === "image/vnd.microsoft.icon";
}

/**
 * Resolve a favicon for a website URL.
 * Order: <link rel=icon> tags → /favicon.ico → Google s2 favicon service.
 * Returns null when nothing valid could be found.
 */
export async function fetchFavicon(websiteUrl: string): Promise<string | null> {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;
  let origin: string;
  try {
    origin = new URL(websiteUrl).origin;
  } catch {
    return null;
  }

  const candidates: string[] = [];

  try {
    candidates.push(...(await scrapeFaviconLinks(origin)));
  } catch {
    /* ignore */
  }
  candidates.push(new URL("/favicon.ico", origin).toString());
  candidates.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);

  for (const candidate of candidates) {
    // Only allow http(s) URLs we scraped or constructed.
    if (!/^https?:\/\//i.test(candidate)) continue;
    if (await isImageUrl(candidate)) return candidate;
  }
  return null;
}
