import Stripe from "stripe";
import { SETTING_KEYS, getSettings } from "@/lib/settings";

/**
 * Stripe configuration with explicit sandbox (test) and live modes.
 * Values come from the admin panel (DB settings) with env fallbacks.
 */
export type StripeMode = "test" | "live";

export type StripeConfig = {
  /** Whether paid submission is turned on and a key exists. */
  enabled: boolean;
  mode: StripeMode;
  secretKey: string;
  webhookSecret: string;
  /** One-time submission fee in cents. */
  priceCents: number;
};

export async function getStripeConfig(): Promise<StripeConfig> {
  const s = await getSettings();
  const mode: StripeMode = s[SETTING_KEYS.stripeMode] === "live" ? "live" : "test";
  const secretKey =
    (mode === "live" ? s[SETTING_KEYS.stripeSecretLive] : s[SETTING_KEYS.stripeSecretTest]) || "";
  const webhookSecret =
    (mode === "live" ? s[SETTING_KEYS.stripeWebhookLive] : s[SETTING_KEYS.stripeWebhookTest]) || "";
  const priceCentsRaw = Number(s[SETTING_KEYS.priceCents]);
  const priceCents = Number.isFinite(priceCentsRaw) && priceCentsRaw > 0 ? priceCentsRaw : 900;
  return {
    enabled: s[SETTING_KEYS.paymentEnabled] === "true" && !!secretKey,
    mode,
    secretKey,
    webhookSecret,
    priceCents,
  };
}

/** Stripe client for the active mode, or null when not configured. */
export async function getStripe(): Promise<Stripe | null> {
  const { secretKey } = await getStripeConfig();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}
