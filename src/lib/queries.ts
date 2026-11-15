import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { Prisma } from "@prisma/client";

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

  // Paid boosts (boostedUntil in the future) always rank first.
  const now = new Date();
  const boostedWhere = { ...where, boostedUntil: { gt: now } };
  const normalWhere = {
    ...where,
    AND: [{ OR: [{ boostedUntil: null as Date | null }, { boostedUntil: { lte: now } }] }],
  };

  const [boostedTotal, normalTotal] = await Promise.all([
    prisma.tool.count({ where: boostedWhere }),
    prisma.tool.count({ where: normalWhere }),
  ]);
  const total = boostedTotal + normalTotal;

  const include = { category: true, _count: { select: { reviews: true } } } as const;
  const skip = (page - 1) * pageSize;

  // Slice across the merged [boosted..., normal...] list.
  const boostSkip = Math.min(skip, boostedTotal);
  const boostTake = Math.max(0, Math.min(pageSize, boostedTotal - skip));
  const normalSkip = Math.max(0, skip - boostedTotal);
  const normalTake = pageSize - boostTake;

  const [boostedItems, normalItems] = await Promise.all([
    boostTake > 0
      ? prisma.tool.findMany({
          where: boostedWhere,
          orderBy: [{ boostedUntil: "desc" as const }],
          skip: boostSkip,
          take: boostTake,
          include,
        })
      : Promise.resolve([]),
    normalTake > 0
      ? prisma.tool.findMany({
          where: normalWhere,
          orderBy,
          skip: normalSkip,
          take: normalTake,
          include,
        })
      : Promise.resolve([]),
  ]);

  const items = [...boostedItems, ...normalItems];

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

/** Category as returned by getCategories — includes the count of approved tools. */
export type CategoryWithToolCount = Prisma.CategoryGetPayload<{
  include: { _count: { select: { tools: { where: { status: "APPROVED" } } } } };
}>;

export async function getCategories() {
  const cached = await cacheGet("categories");
  if (cached) return JSON.parse(cached) as CategoryWithToolCount[];
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

/** Every approved tool, slim fields — used for the homepage marquee. */
export async function getAllApprovedTools() {
  return prisma.tool.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, name: true, logo: true },
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
