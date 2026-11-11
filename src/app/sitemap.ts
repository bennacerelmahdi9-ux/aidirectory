import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tools = await prisma.tool.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } });
  const models = await prisma.aIModel.findMany({ select: { slug: true, updatedAt: true } });
  const categories = await prisma.category.findMany({ select: { slug: true, updatedAt: true } });

  const routes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date() },
    { url: `${base}/tools`, lastModified: new Date() },
    { url: `${base}/models`, lastModified: new Date() },
    { url: `${base}/resources`, lastModified: new Date() },
    { url: `${base}/compare`, lastModified: new Date() },
  ];

  for (const c of categories) routes.push({ url: `${base}/tools?category=${c.slug}`, lastModified: c.updatedAt });
  for (const t of tools) routes.push({ url: `${base}/tools/${t.slug}`, lastModified: t.updatedAt });
  for (const m of models) routes.push({ url: `${base}/models/${m.slug}`, lastModified: m.updatedAt });

  return routes;
}
