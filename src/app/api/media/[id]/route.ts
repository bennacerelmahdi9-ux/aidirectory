import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serve an uploaded branding asset (logo / favicon / OG image) from the
 * Media table. The media id changes on every re-upload, so the response
 * can be cached immutably.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^c?[a-z0-9]{20,32}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
