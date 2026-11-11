"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { fetchFavicon } from "@/lib/favicon";
import { generateToolDraft as aiGenerateToolDraft } from "@/lib/ai";
import { getStripe, paymentEnabled, submissionPriceCents } from "@/lib/stripe";

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
      status: paymentEnabled() ? "PENDING_PAYMENT" : "PENDING",
      submittedById: session.user.id,
    },
  });

  // Best-effort favicon fetch — never blocks or fails the submission.
  const logo = await fetchFavicon(websiteUrl).catch(() => null);
  if (logo) {
    await prisma.tool.update({ where: { id: tool.id }, data: { logo } });
  }

  if (tool.status === "PENDING_PAYMENT") {
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (!stripe) {
      // Misconfigured payment: fall back to the normal review flow.
      await prisma.tool.update({ where: { id: tool.id }, data: { status: "PENDING" } });
    } else {
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: session.user.email ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: submissionPriceCents(),
              product_data: { name: "AIAtlas tool submission review", description: `One-time review fee for "${name}"` },
            },
          },
        ],
        metadata: { toolId: tool.id },
        success_url: `${appUrl}/submit/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/submit?canceled=1`,
      });
      if (checkout.url) {
        await prisma.tool.update({ where: { id: tool.id }, data: { stripeSessionId: checkout.id } });
        return { ok: true, checkoutUrl: checkout.url };
      }
      // No checkout URL: fall back to the normal review flow.
      await prisma.tool.update({ where: { id: tool.id }, data: { status: "PENDING" } });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/tools");
  return { ok: true };
}

/** AI-generated draft for the submit form (OpenRouter). */
export async function generateToolDraft(websiteUrl: string, categoryNames: string[]) {
  try {
    const draft = await aiGenerateToolDraft(websiteUrl, categoryNames);
    return { ok: true as const, ...draft };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Generation failed." };
  }
}

/** Mark a tool as paid after checkout completes. Called by the success page and the webhook. */
export async function markToolPaidBySession(sessionId: string) {
  const stripe = getStripe();
  if (!stripe || !sessionId) return { ok: false, error: "Payment verification unavailable." };
  const checkout = await stripe.checkout.sessions.retrieve(sessionId);
  if (checkout.payment_status !== "paid" || !checkout.metadata?.toolId) {
    return { ok: false, error: "Payment not completed." };
  }
  const tool = await prisma.tool.findUnique({ where: { id: checkout.metadata.toolId } });
  if (!tool) return { ok: false, error: "Tool not found." };
  if (tool.status === "PENDING_PAYMENT") {
    await prisma.tool.update({
      where: { id: tool.id },
      data: { status: "PENDING", paidAt: new Date(), stripeSessionId: checkout.id },
    });
    revalidatePath("/admin");
  }
  return { ok: true as const, toolSlug: tool.slug };
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
