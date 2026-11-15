/**
 * Site branding (logo, favicon, OpenGraph image) configured from the
 * admin panel. Assets live in the Media table and are served from
 * /api/media/[id]; the Setting rows store the current media id.
 */

import { SETTING_KEYS, getSettings } from "@/lib/settings";

export type Branding = {
  /** Media id of the header logo (or null for the default letter mark). */
  logoId: string | null;
  /** Media id of the favicon (or null when unset). */
  faviconId: string | null;
  /** Media id of the OpenGraph image (or null when unset). */
  ogImageId: string | null;
  mediaPath: (id: string) => string;
};

export async function getBranding(): Promise<Branding> {
  const s = await getSettings();
  return {
    logoId: s[SETTING_KEYS.brandingLogo] || null,
    faviconId: s[SETTING_KEYS.brandingFavicon] || null,
    ogImageId: s[SETTING_KEYS.brandingOgImage] || null,
    mediaPath: (id: string) => `/api/media/${id}`,
  };
}

/**
 * Metadata fragment with favicon + OG image so every page that defines
 * its own `generateMetadata` can merge branding in (Next merges metadata
 * shallowly — a child `openGraph` replaces the parent's entirely).
 */
export async function brandingMetadata(): Promise<{
  icons?: { url: string; type?: string }[];
  openGraphImages?: { url: string }[];
}> {
  const b = await getBranding();
  const out: { icons?: { url: string; type?: string }[]; openGraphImages?: { url: string }[] } = {};
  if (b.faviconId) out.icons = [{ url: b.mediaPath(b.faviconId) }];
  if (b.ogImageId) out.openGraphImages = [{ url: b.mediaPath(b.ogImageId) }];
  return out;
}
