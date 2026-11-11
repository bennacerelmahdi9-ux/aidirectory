import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeMode, webhookSecretForMode } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Configure two endpoints (one per mode) in the Stripe
 * dashboard pointing here; the secret selects itself by STRIPE_MODE.
 * Handles: checkout.session.completed -> mark the tool as paid (PENDING).
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = webhookSecretForMode(stripeMode());
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const toolId = session.metadata?.toolId;
    if (toolId && session.payment_status === "paid") {
      await prisma.tool.updateMany({
        where: { id: toolId, status: "PENDING_PAYMENT" },
        data: { status: "PENDING", paidAt: new Date(), stripeSessionId: session.id },
      });
    }
  }

  return NextResponse.json({ received: true });
}
