/**
 * Tool website health checks. Shared between the scheduled script
 * (scripts/health-check.ts) and the admin panel's on-demand re-check.
 */

const FETCH_TIMEOUT_MS = 10_000;

/**
 * Check whether a tool's website still responds.
 * A site is considered alive when any request succeeds with a status
 * below 500 (401/403 often just mean bot protection, not a dead site).
 */
export async function isSiteAlive(websiteUrl: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(websiteUrl)) return false;

  // Some hosts reject HEAD; try HEAD first, fall back to GET.
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const res = await fetch(websiteUrl, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "user-agent": "AIAtlas/1.0 (+https://aiatlas.dev)" },
      });
      if (res.status < 500) return true;
    } catch {
      /* try next method */
    }
  }
  return false;
}
