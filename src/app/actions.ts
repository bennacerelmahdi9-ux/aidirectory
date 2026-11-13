"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { fetchFavicon } from "@/lib/favicon";
import { generateToolDraft as aiGenerateToolDraft, parseNaturalLanguageQuery, compareToolsWithAI } from "@/lib/ai";
import { getStripe, getStripeConfig } from "@/lib/stripe";
import { SETTING_KEYS, setSettings } from "@/lib/settings";
import { checkRateLimit, rateLimitError } from "@/lib/rate-limit";
import { isSiteAlive } from "@/lib/health";
import { headers } from "next/headers";
import DOMPurify from "isomorphic-dompurify";
import { stripHtml, looksLikeHtml } from "@/lib/utils";

/** Rate-limit key for the current caller: user id when logged in, else IP. */
async function callerKey(prefix: string): Promise<string> {
  const session = await auth();
  if (session?.user?.id) return `${prefix}:user:${session.user.id}`;
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
    return `${prefix}:ip:${ip}`;
  } catch {
    return `${prefix}:anon`;
  }
}

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

  // Max 10 submissions per user/IP per day.
  const rl = await checkRateLimit(await callerKey("submit"), 10, 24 * 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: rateLimitError(rl.retryAfterSec) };

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

/** AI-generated draft for the submit form (OpenRouter). Max 5 per hour. */
export async function generateToolDraft(websiteUrl: string, categoryNames: string[]) {
  try {
    const rl = await checkRateLimit(await callerKey("ai-draft"), 5, 60 * 60 * 1000);
    if (!rl.ok) return { ok: false as const, error: rateLimitError(rl.retryAfterSec) };
    const draft = await aiGenerateToolDraft(websiteUrl, categoryNames);
    return { ok: true as const, ...draft };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Generation failed." };
  }
}

/**
 * Natural-language search (#3): parse a free-text query into directory
 * filters via OpenRouter, then hand back the /tools URL to navigate to.
 * Max 10 AI searches per hour.
 */
export async function aiSearchTools(query: string) {
  const q = query.trim();
  if (!q) return { ok: false as const, error: "Type what you're looking for first." };
  if (q.length > 200) return { ok: false as const, error: "Query too long (max 200 characters)." };
  try {
    const rl = await checkRateLimit(await callerKey("ai-search"), 10, 60 * 60 * 1000);
    if (!rl.ok) return { ok: false as const, error: rateLimitError(rl.retryAfterSec) };

    const { getCategories } = await import("@/lib/queries");
    const categories = await getCategories();
    const categoryNames = categories.map((c) => c.name as string);

    const parsed = await parseNaturalLanguageQuery(q, categoryNames);

    // Build the /tools URL from the parsed filters.
    const params = new URLSearchParams();
    params.set("q", parsed.cleanedQuery || q);
    params.set("ai", q);
    if (parsed.category) {
      const cat = categories.find((c) => c.name === parsed.category);
      if (cat) params.set("category", String(cat.slug));
    }
    if (parsed.pricing) params.set("pricing", parsed.pricing);
    if (parsed.free) params.set("free", "1");
    if (parsed.openSource) params.set("openSource", "1");
    // Extra tags narrow the text search when the model extracted keywords.
    if (parsed.tags?.length && parsed.cleanedQuery) {
      params.set("tags", parsed.tags.join(","));
    }

    // Human-readable summary of what the AI understood.
    const understood: string[] = [];
    if (parsed.category) understood.push(`category: ${parsed.category}`);
    if (parsed.pricing) understood.push(`pricing: ${parsed.pricing.toLowerCase()}`);
    if (parsed.free) understood.push("has a free plan");
    if (parsed.openSource) understood.push("open source");
    if (parsed.tags?.length) understood.push(`tags: ${parsed.tags.join(", ")}`);

    return { ok: true as const, url: `/tools?${params.toString()}`, understood };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "AI search failed." };
  }
}

/**
 * AI comparison (#1): generate a narrative comparison for the tools
 * currently on /compare. Max 5 per hour.
 */
export async function aiCompareTools(ids: string) {
  try {
    const rl = await checkRateLimit(await callerKey("ai-compare"), 5, 60 * 60 * 1000);
    if (!rl.ok) return { ok: false as const, error: rateLimitError(rl.retryAfterSec) };

    const slugs = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
    if (slugs.length < 2) return { ok: false as const, error: "Pick at least two tools to compare." };

    const tools = await prisma.tool.findMany({
      where: { slug: { in: slugs }, status: "APPROVED" },
    });
    if (tools.length < 2) return { ok: false as const, error: "Could not find those tools." };

    const text = await compareToolsWithAI(
      tools.map((t) => ({
        name: t.name,
        description: t.description,
        websiteUrl: t.websiteUrl,
        pricingModel: t.pricingModel,
        hasFreePlan: t.hasFreePlan,
        isOpenSource: t.isOpenSource,
        tags: t.tags,
      })),
    );
    return { ok: true as const, text };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "AI comparison failed." };
  }
}

/**
 * Paid boost (#12): start a one-time Stripe checkout that places the
 * tool at the top of /tools for the configured number of days.
 */
export async function startToolBoost(toolId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool || tool.status !== "APPROVED") {
    return { ok: false, error: "Only published tools can be boosted." };
  }
  if (tool.submittedById !== session.user.id && session.user.role !== "ADMIN") {
    return { ok: false, error: "You can only boost tools you submitted." };
  }

  const config = await getStripeConfig();
  const stripe = config.secretKey ? await getStripe() : null;
  if (!stripe) {
    return { ok: false, error: "Payments are not configured yet. Boosts are unavailable." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: config.boostPriceCents,
          product_data: {
            name: `AIAtlas boost for "${tool.name}"`,
            description: `Sponsored placement at the top of the directory for ${config.boostDays} days`,
          },
        },
      },
    ],
    metadata: { toolId: tool.id, boost: "1", days: String(config.boostDays) },
    success_url: `${appUrl}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/tools/${tool.slug}?boost=cancelled`,
  });

  if (checkout.url) {
    await prisma.tool.update({ where: { id: tool.id }, data: { stripeSessionId: checkout.id } });
    return { ok: true, checkoutUrl: checkout.url };
  }
  return { ok: false, error: "Could not start checkout. Try again." };
}

/** Mark a boost as paid after checkout completes (success page + webhook). */
export async function markBoostPaidBySession(sessionId: string) {
  const stripe = await getStripe();
  if (!stripe || !sessionId) return { ok: false as const, error: "Payment verification unavailable." };
  const checkout = await stripe.checkout.sessions.retrieve(sessionId);
  if (checkout.payment_status !== "paid" || checkout.metadata?.boost !== "1" || !checkout.metadata.toolId) {
    return { ok: false as const, error: "Payment not completed." };
  }
  const days = Math.min(Math.max(Number(checkout.metadata.days) || 30, 1), 365);
  const tool = await prisma.tool.findUnique({ where: { id: checkout.metadata.toolId } });
  if (!tool) return { ok: false as const, error: "Tool not found." };

  // Stack boosts: extend from the current expiry when still boosted.
  const base = tool.boostedUntil && tool.boostedUntil > new Date() ? tool.boostedUntil : new Date();
  const boostedUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  await prisma.tool.update({
    where: { id: tool.id },
    data: { boostedUntil, stripeSessionId: checkout.id },
  });
  revalidatePath("/tools");
  return { ok: true as const, toolSlug: tool.slug, boostedUntil };
}

/** Admin: grant or clear a boost manually (no payment). */
export async function adminToggleBoost(toolId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { ok: false, error: "Forbidden." };
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) return { ok: false, error: "Tool not found." };

  const active = tool.boostedUntil && tool.boostedUntil > new Date();
  const boostedUntil = active ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.tool.update({ where: { id: toolId }, data: { boostedUntil } });
  revalidatePath("/admin");
  revalidatePath("/tools");
  return { ok: true };
}

/** Admin/moderator: re-run the site health check for one tool. */
export async function checkToolHealth(toolId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
    return { ok: false, error: "Forbidden." };
  }
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) return { ok: false, error: "Tool not found." };

  const alive = await isSiteAlive(tool.websiteUrl);
  await prisma.tool.update({
    where: { id: toolId },
    data: { isDead: !alive, lastCheckedAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath(`/tools/${tool.slug}`);
  return { ok: true, alive };
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

  const boostDollars = Number(formData.get("boostDollars"));
  if (Number.isFinite(boostDollars) && boostDollars > 0) {
    entries[SETTING_KEYS.boostPriceCents] = String(Math.round(boostDollars * 100));
  }

  const boostDays = Number(formData.get("boostDays"));
  if (Number.isFinite(boostDays) && boostDays > 0) {
    entries[SETTING_KEYS.boostDays] = String(Math.floor(boostDays));
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
