import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SETTING_KEYS, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Serves /favicon.ico. When an admin has uploaded a favicon (stored in the
 * Media table) it is served directly with immutable caching — the media id
 * changes on every re-upload. Otherwise it falls back to the bundled
 * default icon in /public/favicon-default.ico.
 *
 * next.config.ts rewrites /favicon.ico here (the src/app/favicon.ico file
 * convention was removed so Next no longer injects its own icon link).
 */
export async function GET(request: Request) {
  const settings = await getSettings();
  const mediaId = settings[SETTING_KEYS.brandingFavicon];

  if (mediaId) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (media) {
      const body = new Uint8Array(media.data);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "content-type": media.mimeType,
          "content-length": String(body.byteLength),
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return NextResponse.redirect(new URL("/favicon-default.ico", request.url), 307);
}
