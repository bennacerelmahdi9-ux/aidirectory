import Stripe from "stripe";

/**
 * Stripe configuration with explicit sandbox (test) and live modes.
 *
 * Env vars:
 *   SUBMISSION_PAYMENT_ENABLED      "true" to require payment for submissions
 *   STRIPE_MODE                     "test" (sandbox) | "live"
 *   STRIPE_SECRET_KEY_TEST          sk_test_...
 *   STRIPE_SECRET_KEY_LIVE          sk_live_...
 *   STRIPE_WEBHOOK_SECRET_TEST      whsec_... (sandbox webhook)
 *   STRIPE_WEBHOOK_SECRET_LIVE      whsec_... (live webhook)
 *   STRIPE_SUBMISSION_PRICE_CENTS   one-time fee in cents (default 900)
 */
export type StripeMode = "test" | "live";

export function stripeMode(): StripeMode {
  return process.env.STRIPE_MODE === "live" ? "live" : "test";
}

export function paymentEnabled(): boolean {
  if (process.env.SUBMISSION_PAYMENT_ENABLED !== "true") return false;
  return !!secretKeyForMode(stripeMode());
}

function secretKeyForMode(mode: StripeMode): string | undefined {
  return mode === "live"
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
}

export function webhookSecretForMode(mode: StripeMode): string | undefined {
  return mode === "live"
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;
}

export function submissionPriceCents(): number {
  const n = Number(process.env.STRIPE_SUBMISSION_PRICE_CENTS ?? 900);
  return Number.isFinite(n) && n > 0 ? n : 900;
}

/** Stripe client for the active mode, or null when payment is not configured. */
export function getStripe(): Stripe | null {
  const key = secretKeyForMode(stripeMode());
  if (!key) return null;
  return new Stripe(key);
}
