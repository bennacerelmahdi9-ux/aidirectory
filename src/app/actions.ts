"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { fetchFavicon } from "@/lib/favicon";
import { generateToolDraft as aiGenerateToolDraft } from "@/lib/ai";
import { getStripe, getStripeConfig } from "@/lib/stripe";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import DOMPurify from "isomorphic-dompurify";
import { stripHtml, looksLikeHtml } from "@/lib/utils";

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

  // Rich description: sanitize before it ever touches the database.
  const rawLong = String(formData.get("longDescription") ?? "");
  const longDescription = looksLikeHtml(rawLong) ? DOMPurify.sanitize(rawLong) : null;
  const plainDescription = stripHtml(description || rawLong).slice(0, 300);

  const slug = slugify(name) + "-" + Date.now().toString(36);

  const pay = await getStripeConfig();

  const tool = await prisma.tool.create({
    data: {
      slug,
      name,
      description: plainDescription,
      longDescription,
      websiteUrl,
      categoryId,
      pricingModel: pricingModel as never,
      hasFreePlan,
      isOpenSource,
      tags,
      platforms: [],
      status: pay.enabled ? "PENDING_PAYMENT" : "PENDING",
      submittedById: session.user.id,
    },
  });

  // Best-effort favicon fetch — never blocks or fails the submission.
  const logo = await fetchFavicon(websiteUrl).catch(() => null);
  if (logo) {
    await prisma.tool.update({ where: { id: tool.id }, data: { logo } });
  }

  if (tool.status === "PENDING_PAYMENT") {
    const stripe = pay.secretKey ? await getStripe() : null;
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
              unit_amount: pay.priceCents,
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
  const stripe = await getStripe();
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

export async function deleteUser(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };
  if (session.user.id === userId) return { ok: false, error: "You cannot delete your own account." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  // Remove dependent records first (reviews have no cascade on user).
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { userId } }),
    prisma.bookmark.deleteMany({ where: { userId } }),
    prisma.report.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Save admin panel settings (pricing, payment, Stripe, OpenRouter). ADMIN only. */
export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };

  const entries: Record<string, string> = {};

  const paymentEnabled = formData.get("paymentEnabled") === "on";
  entries[SETTING_KEYS.paymentEnabled] = paymentEnabled ? "true" : "false";

  const priceDollars = Number(formData.get("priceDollars"));
  if (Number.isFinite(priceDollars) && priceDollars > 0) {
    entries[SETTING_KEYS.priceCents] = String(Math.round(priceDollars * 100));
  }

  const stripeMode = String(formData.get("stripeMode") ?? "");
  if (stripeMode === "test" || stripeMode === "live") entries[SETTING_KEYS.stripeMode] = stripeMode;

  // Secrets: only overwrite when a new value is provided (masked otherwise).
  const secretFields: [string, string][] = [
    [SETTING_KEYS.stripeSecretTest, "stripeSecretTest"],
    [SETTING_KEYS.stripeSecretLive, "stripeSecretLive"],
    [SETTING_KEYS.stripeWebhookTest, "stripeWebhookTest"],
    [SETTING_KEYS.stripeWebhookLive, "stripeWebhookLive"],
    [SETTING_KEYS.openrouterApiKey, "openrouterApiKey"],
  ];
  for (const [key, field] of secretFields) {
    const value = String(formData.get(field) ?? "").trim();
    if (value) entries[key] = value;
  }

  const openrouterModel = String(formData.get("openrouterModel") ?? "").trim();
  if (openrouterModel) entries[SETTING_KEYS.openrouterModel] = openrouterModel;

  await setSettings(entries);
  revalidatePath("/admin");
  revalidatePath("/submit");
  return { ok: true };
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { ok: false, error: "Forbidden." };
  }
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const slug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return { ok: false, error: "Category slug already exists." };

  await prisma.category.create({
    data: {
      name,
      slug,
      description: description || null,
    },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };

  const toolCount = await prisma.tool.count({ where: { categoryId: id } });
  if (toolCount > 0) {
    return { ok: false, error: `Cannot delete: category has ${toolCount} tool(s). Reassign them first.` };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}
