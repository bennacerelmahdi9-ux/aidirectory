import { prisma } from "@/lib/prisma";

/**
 * Admin-configurable settings stored in the DB, with environment variables
 * as fallback defaults. Keys are grouped by feature.
 */
export const SETTING_KEYS = {
  paymentEnabled: "submission.paymentEnabled",
  priceCents: "submission.priceCents",
  boostPriceCents: "boost.priceCents",
  boostDays: "boost.days",
  stripeMode: "stripe.mode",
  stripeSecretTest: "stripe.secretKeyTest",
  stripeSecretLive: "stripe.secretKeyLive",
  stripeWebhookTest: "stripe.webhookSecretTest",
  stripeWebhookLive: "stripe.webhookSecretLive",
  openrouterApiKey: "openrouter.apiKey",
  openrouterModel: "openrouter.model",
  brandingLogo: "branding.logo",
  brandingFavicon: "branding.favicon",
  brandingOgImage: "branding.ogImage",
} as const;

/** Env-based defaults, overridable from the admin panel. */
function envDefaults(): Record<string, string> {
  return {
    [SETTING_KEYS.paymentEnabled]: process.env.SUBMISSION_PAYMENT_ENABLED === "true" ? "true" : "false",
    [SETTING_KEYS.priceCents]: process.env.STRIPE_SUBMISSION_PRICE_CENTS || "900",
    [SETTING_KEYS.boostPriceCents]: process.env.STRIPE_BOOST_PRICE_CENTS || "2900",
    [SETTING_KEYS.boostDays]: process.env.BOOST_DURATION_DAYS || "30",
    [SETTING_KEYS.stripeMode]: process.env.STRIPE_MODE === "live" ? "live" : "test",
    [SETTING_KEYS.stripeSecretTest]: process.env.STRIPE_SECRET_KEY_TEST || "",
    [SETTING_KEYS.stripeSecretLive]: process.env.STRIPE_SECRET_KEY_LIVE || "",
    [SETTING_KEYS.stripeWebhookTest]: process.env.STRIPE_WEBHOOK_SECRET_TEST || "",
    [SETTING_KEYS.stripeWebhookLive]: process.env.STRIPE_WEBHOOK_SECRET_LIVE || "",
    [SETTING_KEYS.openrouterApiKey]: process.env.OPENROUTER_API_KEY || "",
    [SETTING_KEYS.openrouterModel]: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    [SETTING_KEYS.brandingLogo]: "",
    [SETTING_KEYS.brandingFavicon]: "",
    [SETTING_KEYS.brandingOgImage]: "",
  };
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const stored: Record<string, string> = {};
  for (const row of rows) stored[row.key] = row.value;
  return { ...envDefaults(), ...stored };
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
}

/** "sk-test-1234abcd…" — safe to render in the admin UI. */
export function maskSecret(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 12) return "••••••••";
  return `${value.slice(0, 7)}••••••••${value.slice(-4)}`;
}
