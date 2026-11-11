"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { fetchFavicon } from "@/lib/favicon";

export async function registerUser(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!email || password.length < 6) {
    return { ok: false, error: "Invalid email or password (min 6 chars)." };
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "Email already registered." };
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name: name || null, passwordHash } });
  return { ok: true };
}

export async function submitTool(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const pricingModel = String(formData.get("pricingModel") ?? "FREEMIUM");
  const hasFreePlan = formData.get("hasFreePlan") === "on";
  const isOpenSource = formData.get("isOpenSource") === "on";
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!name || !description || !websiteUrl || !categoryId) {
    return { ok: false, error: "Missing required fields." };
  }

  const slug = slugify(name) + "-" + Date.now().toString(36);

  const tool = await prisma.tool.create({
    data: {
      slug,
      name,
      description,
      websiteUrl,
      categoryId,
      pricingModel: pricingModel as never,
      hasFreePlan,
      isOpenSource,
      tags,
      platforms: [],
      status: "PENDING",
      submittedById: session.user.id,
    },
  });

  // Best-effort favicon fetch — never blocks or fails the submission.
  const logo = await fetchFavicon(websiteUrl).catch(() => null);
  if (logo) {
    await prisma.tool.update({ where: { id: tool.id }, data: { logo } });
  }

  revalidatePath("/admin");
  revalidatePath("/tools");
  return { ok: true };
}

export async function toggleBookmark(toolId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };
  const existing = await prisma.bookmark.findUnique({
    where: { userId_toolId: { userId: session.user.id, toolId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId: session.user.id, toolId } });
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addReview(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };
  const toolId = String(formData.get("toolId") ?? "");
  const toolSlug = String(formData.get("toolSlug") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  if (!toolId || rating < 1 || rating > 5) return { ok: false, error: "Invalid review." };

  await prisma.review.upsert({
    where: { userId_toolId: { userId: session.user.id, toolId } },
    update: { rating, comment: comment || null },
    create: { userId: session.user.id, toolId, rating, comment: comment || null },
  });
  revalidatePath(`/tools/${toolSlug}`);
  return { ok: true };
}

export async function reportTool(formData: FormData) {
  const session = await auth();
  const toolId = String(formData.get("toolId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!toolId || !reason) return { ok: false, error: "Missing fields." };
  await prisma.report.create({
    data: { toolId, reason, userId: session?.user?.id ?? null },
  });
  return { ok: true };
}

export async function approveTool(toolId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { ok: false, error: "Forbidden." };
  }
  await prisma.tool.update({ where: { id: toolId }, data: { status: "APPROVED", lastVerifiedAt: new Date() } });
  revalidatePath("/admin");
  revalidatePath("/tools");
  return { ok: true };
}

export async function rejectTool(toolId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { ok: false, error: "Forbidden." };
  }
  await prisma.tool.update({ where: { id: toolId }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteTool(toolId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };
  await prisma.tool.delete({ where: { id: toolId } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleFeatured(toolId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) return { ok: false };
  await prisma.tool.update({ where: { id: toolId }, data: { featured: !tool.featured } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateUserRole(userId: string, role: "USER" | "MODERATOR" | "ADMIN") {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
  return { ok: true };
}
