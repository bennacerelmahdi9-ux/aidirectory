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
  /** One-time boost fee in cents. */
  boostPriceCents: number;
  /** How many days a boost lasts. */
  boostDays: number;
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
  const boostPriceCentsRaw = Number(s[SETTING_KEYS.boostPriceCents]);
  const boostPriceCents = Number.isFinite(boostPriceCentsRaw) && boostPriceCentsRaw > 0 ? boostPriceCentsRaw : 2900;
  const boostDaysRaw = Number(s[SETTING_KEYS.boostDays]);
  const boostDays = Number.isFinite(boostDaysRaw) && boostDaysRaw > 0 ? Math.floor(boostDaysRaw) : 30;
  return {
    enabled: s[SETTING_KEYS.paymentEnabled] === "true" && !!secretKey,
    mode,
    secretKey,
    webhookSecret,
    priceCents,
    boostPriceCents,
    boostDays,
  };
}

/** Stripe client for the active mode, or null when not configured. */
export async function getStripe(): Promise<Stripe | null> {
  const { secretKey } = await getStripeConfig();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}
