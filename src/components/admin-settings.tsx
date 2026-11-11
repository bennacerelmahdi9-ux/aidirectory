"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/app/actions";
import { toast } from "sonner";

export type AdminSettingsData = {
  isAdmin: boolean;
  paymentEnabled: boolean;
  priceDollars: string;
  stripeMode: "test" | "live";
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
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="paymentEnabled" defaultChecked={data.paymentEnabled} className="accent-[var(--primary)]" />
            Require payment to submit
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Status: payments {data.paymentEnabled ? "on" : "off"} — Stripe {data.stripeConfigured ? "configured" : "not configured"}.
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
