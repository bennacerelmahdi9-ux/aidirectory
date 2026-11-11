import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";

export type ToolFilters = {
  q?: string;
  category?: string;
  pricing?: string;
  free?: boolean;
  openSource?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function getTools(filters: ToolFilters = {}) {
  const { q, category, pricing, free, openSource, sort = "popular", page = 1, pageSize = 24 } = filters;

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (category) where.category = { slug: category };
  if (pricing) where.pricingModel = pricing;
  if (free) where.hasFreePlan = true;
  if (openSource) where.isOpenSource = true;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: [q.toLowerCase()] } },
    ];
  }

  let orderBy: Record<string, string> = { viewCount: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };
  else if (sort === "updated") orderBy = { updatedAt: "desc" };
  else if (sort === "name") orderBy = { name: "asc" };

  const [items, total] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true, _count: { select: { reviews: true } } },
    }),
    prisma.tool.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getToolBySlug(slug: string) {
  return prisma.tool.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true, bookmarks: true } },
    },
  });
}

export async function getCategories() {
  const cached = await cacheGet("categories");
  if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof prisma.category.findMany>>;
  const cats = await prisma.category.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { tools: { where: { status: "APPROVED" } } } } } });
  await cacheSet("categories", JSON.stringify(cats), 300);
  return cats;
}

export async function getFeaturedTools(limit = 8) {
  return prisma.tool.findMany({
    where: { status: "APPROVED", featured: true },
    orderBy: { viewCount: "desc" },
    take: limit,
    include: { category: true },
  });
}

export async function getRecentTools(limit = 8) {
  return prisma.tool.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { category: true },
  });
}

export async function getFreeTools(limit = 8) {
  return prisma.tool.findMany({
    where: { status: "APPROVED", hasFreePlan: true },
    orderBy: { viewCount: "desc" },
    take: limit,
    include: { category: true },
  });
}

export async function getOpenSourceTools(limit = 8) {
  return prisma.tool.findMany({
    where: { status: "APPROVED", isOpenSource: true },
    orderBy: { viewCount: "desc" },
    take: limit,
    include: { category: true },
  });
}

export async function getModels(provider?: string) {
  const where = provider ? { provider } : {};
  return prisma.aIModel.findMany({ where, orderBy: [{ provider: "asc" }, { name: "asc" }] });
}

export async function getModelBySlug(slug: string) {
  return prisma.aIModel.findUnique({ where: { slug } });
}

export async function getResources(type?: string) {
  const where = type ? { type: type as never } : {};
  return prisma.developerResource.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getBookmarksByUser(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    include: { tool: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function incrementView(slug: string) {
  try {
    await prisma.tool.update({ where: { slug }, data: { viewCount: { increment: 1 } } });
  } catch {
    /* ignore */
  }
}
