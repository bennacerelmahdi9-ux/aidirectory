import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeConfig } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Configure two endpoints (one per mode) in the Stripe
 * dashboard pointing here; the secret selects itself by the active mode.
 * Handles: checkout.session.completed -> mark the tool as paid (PENDING).
 */
export async function POST(request: Request) {
  const config = await getStripeConfig();
  if (!config.secretKey || !config.webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(config.secretKey);
    event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const toolId = session.metadata?.toolId;
    if (toolId && session.payment_status === "paid") {
      if (session.metadata?.boost === "1") {
        // Paid boost: extend boostedUntil from the current expiry.
        const days = Math.min(Math.max(Number(session.metadata.days) || 30, 1), 365);
        const tool = await prisma.tool.findUnique({ where: { id: toolId } });
        const base = tool?.boostedUntil && tool.boostedUntil > new Date() ? tool.boostedUntil : new Date();
        await prisma.tool.update({
          where: { id: toolId },
          data: {
            boostedUntil: new Date(base.getTime() + days * 24 * 60 * 60 * 1000),
            stripeSessionId: session.id,
          },
        });
      } else {
        // Submission fee: move the tool into review.
        await prisma.tool.updateMany({
          where: { id: toolId, status: "PENDING_PAYMENT" },
          data: { status: "PENDING", paidAt: new Date(), stripeSessionId: session.id },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
