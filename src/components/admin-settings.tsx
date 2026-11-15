"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings, uploadBrandingImage, resetBrandingImage } from "@/app/actions";
import { toast } from "sonner";

export type AdminSettingsData = {
  isAdmin: boolean;
  paymentEnabled: boolean;
  priceDollars: string;
  boostDollars: string;
  boostDays: string;
  stripeMode: "test" | "live";
  /** Media ids for branding assets (null = default in use). */
  logoId: string | null;
  faviconId: string | null;
  ogImageId: string | null;
  stripeSecretTest: string;
  stripeSecretLive: string;
  stripeWebhookTest: string;
  stripeWebhookLive: string;
  openrouterApiKey: string;
  openrouterModel: string;
  /** Derived status flags for the UI. */
  stripeConfigured: boolean;
  aiConfigured: boolean;
};

const field =
  "h-10 w-full rounded-[10px] border border-black/25 bg-card px-3 text-sm dark:border-white/15 dark:bg-white/5";

export function AdminSettings({ data }: { data: AdminSettingsData }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const res = await updateSettings(fd);
    setPending(false);
    if (!res.ok) toast.error(res.error ?? "Failed to save");
    else toast.success("Settings saved.");
  }

  if (!data.isAdmin) {
    return (
      <p className="rounded-xl border p-6 text-sm text-muted-foreground">
        Only admins can change site settings.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-xl border p-6">
      {/* Pricing */}
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold tracking-tight">Submission pricing</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One-time fee charged through Stripe Checkout before a submission enters review.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="priceDollars">Review fee (USD)</Label>
            <Input
              id="priceDollars"
              name="priceDollars"
              type="number"
              min="0.5"
              step="0.5"
              defaultValue={data.priceDollars}
              className={field + " w-32"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="boostDollars">Boost price (USD)</Label>
            <Input
              id="boostDollars"
              name="boostDollars"
              type="number"
              min="0.5"
              step="0.5"
              defaultValue={data.boostDollars}
              className={field + " w-32"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="boostDays">Boost duration (days)</Label>
            <Input
              id="boostDays"
              name="boostDays"
              type="number"
              min="1"
              step="1"
              defaultValue={data.boostDays}
              className={field + " w-32"}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="paymentEnabled" defaultChecked={data.paymentEnabled} className="accent-[var(--primary)]" />
            Require payment to submit
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Status: payments {data.paymentEnabled ? "on" : "off"} — Stripe {data.stripeConfigured ? "configured" : "not configured"}.
          Boosts give sponsored placement at the top of /tools for the configured duration.
        </p>
      </section>

      {/* Stripe keys */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h3 className="font-semibold tracking-tight">Stripe keys</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sandbox uses test keys, live uses live keys. Leave a field empty to keep the current value.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stripeMode">Active mode</Label>
            <select id="stripeMode" name="stripeMode" defaultValue={data.stripeMode} className={field}>
              <option value="test">Sandbox (test)</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripeSecretTest">Secret key (test)</Label>
            <Input id="stripeSecretTest" name="stripeSecretTest" type="password" placeholder={data.stripeSecretTest || "sk_test_..."} className={field} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripeSecretLive">Secret key (live)</Label>
            <Input id="stripeSecretLive" name="stripeSecretLive" type="password" placeholder={data.stripeSecretLive || "sk_live_..."} className={field} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripeWebhookTest">Webhook secret (test)</Label>
            <Input id="stripeWebhookTest" name="stripeWebhookTest" type="password" placeholder={data.stripeWebhookTest || "whsec_..."} className={field} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripeWebhookLive">Webhook secret (live)</Label>
            <Input id="stripeWebhookLive" name="stripeWebhookLive" type="password" placeholder={data.stripeWebhookLive || "whsec_..."} className={field} autoComplete="off" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Webhook endpoint: <code className="font-mono">/api/stripe/webhook</code>
        </p>
      </section>

      {/* OpenRouter */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h3 className="font-semibold tracking-tight">AI generation (OpenRouter)</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Powers the "Generate using AI" button on the submit form.{" "}
            {data.aiConfigured ? "Configured." : "Not configured yet."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="openrouterApiKey">API key</Label>
            <Input id="openrouterApiKey" name="openrouterApiKey" type="password" placeholder={data.openrouterApiKey || "sk-or-v1-..."} className={field} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="openrouterModel">Model</Label>
            <Input id="openrouterModel" name="openrouterModel" defaultValue={data.openrouterModel} className={field} />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}

/** One branding image: preview + upload + clear. Own <form> — not nested in the settings form. */
function BrandingUploader({
  kind,
  label,
  hint,
  mediaId,
  accept,
}: {
  kind: string;
  label: string;
  hint: string;
  mediaId: string | null;
  accept: string;
}) {
  const [current, setCurrent] = useState<string | null>(mediaId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file first.");
      return;
    }
    setBusy(true);
    const res = await uploadBrandingImage(fd).catch(() => ({ ok: false as const, error: "Upload failed." }));
    setBusy(false);
    if (res.ok) {
      setCurrent(res.mediaId ?? null);
      (e.target as HTMLFormElement).reset();
      toast.success(`${label} updated.`);
    } else {
      setError(("error" in res && res.error) || "Upload failed.");
    }
  }

  async function onClear() {
    setError(null);
    setBusy(true);
    const res = await resetBrandingImage(kind).catch(() => ({ ok: false as const, error: "Failed." }));
    setBusy(false);
    if (res.ok) {
      setCurrent(null);
      toast.success(`${label} reset to default.`);
    } else {
      setError(("error" in res && res.error) || "Failed.");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div>
        <h4 className="text-sm font-semibold">{label}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-4">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${current}`}
            alt={label}
            className="h-16 w-16 rounded-lg border bg-card object-contain p-1"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Default
          </div>
        )}
        <form onSubmit={onUpload} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="kind" value={kind} />
          <input
            type="file"
            name="file"
            accept={accept}
            className="max-w-52 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
          />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>
            {busy ? "..." : "Upload"}
          </Button>
          {current && (
            <Button type="button" size="sm" variant="ghost" onClick={onClear} disabled={busy}>
              Clear
            </Button>
          )}
        </form>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Branding section — rendered outside the settings form. */
export function BrandingSettings({
  logoId,
  faviconId,
  ogImageId,
}: {
  logoId: string | null;
  faviconId: string | null;
  ogImageId: string | null;
}) {
  return (
    <div className="mt-8 space-y-4 rounded-xl border p-6">
      <div>
        <h3 className="font-semibold tracking-tight">Branding</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Site logo, favicon, and social share image. PNG, JPEG, WebP, or ICO — max 4 MB.
          Changes apply site-wide immediately.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <BrandingUploader
          kind="logo"
          label="Logo"
          hint="Shown in the header next to the site name. Square works best."
          mediaId={logoId}
          accept="image/png,image/jpeg,image/webp"
        />
        <BrandingUploader
          kind="favicon"
          label="Favicon"
          hint="Browser tab icon. Use a square .png or .ico (32×32+)."
          mediaId={faviconId}
          accept="image/png,image/x-icon,image/vnd.microsoft.icon"
        />
        <BrandingUploader
          kind="ogImage"
          label="OpenGraph image"
          hint="Preview when the site is shared on social media. 1200×630 recommended."
          mediaId={ogImageId}
          accept="image/png,image/jpeg,image/webp"
        />
      </div>
    </div>
  );
}
