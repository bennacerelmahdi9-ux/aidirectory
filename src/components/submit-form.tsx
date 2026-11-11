"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  FieldBox,
  FieldArea,
  CheckboxLine,
  SubmitButton,
} from "@/components/ui/auth-section-1";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitTool, generateToolDraft } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const boxTrigger =
  "flex h-14 w-full items-center justify-between gap-4 rounded-[10px] border border-black/25 bg-card px-5 text-lg leading-none transition-colors focus-visible:border-black/60 focus-visible:ring-0 dark:border-white/15 dark:bg-white/5 dark:focus-visible:border-white/40 xl:text-xl";

const VALID_PRICING = new Set(["FREE", "FREEMIUM", "PAID", "CONTACT", "OPEN_SOURCE"]);

export function SubmitForm({
  categories,
  paymentEnabled,
  priceCents,
}: {
  categories: { id: string; name: string; slug: string }[];
  paymentEnabled: boolean;
  priceCents: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pricing, setPricing] = useState("FREEMIUM");

  // Controlled values so the AI draft can fill fields programmatically.
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  async function onGenerate() {
    if (!websiteUrl.trim()) {
      toast.error("Add the website URL first, then generate.");
      return;
    }
    setGenerating(true);
    const res = await generateToolDraft(websiteUrl.trim(), categories.map((c) => c.name));
    setGenerating(false);
    if (!res.ok) {
      toast.error(res.error ?? "Generation failed.");
      return;
    }
    setName(res.name);
    setDescription(res.description);
    setTags(res.tags.join(", "));
    const match = categories.find(
      (c) => c.name.toLowerCase() === res.category.toLowerCase().trim()
    );
    if (match) setCategoryId(match.id);
    else toast(`AI suggested category "${res.category}" — pick the closest one below.`);
    if (VALID_PRICING.has(res.pricingModel)) setPricing(res.pricingModel);
    toast.success("Draft generated — review and adjust before submitting.");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("categoryId", categoryId);
    fd.set("pricingModel", pricing);
    setPending(true);
    const res = await submitTool(fd);
    if ("checkoutUrl" in res && res.checkoutUrl) {
      // Paid submission — hand off to Stripe Checkout (sandbox or live by key).
      window.location.href = res.checkoutUrl;
      return;
    }
    setPending(false);
    if (!res.ok) toast.error(res.error ?? "Failed");
    else {
      toast.success("Submitted for review");
      router.push("/tools");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldBox label="Tool name" name="name" required autoComplete="off" value={name} onValueChange={setName} />
        <FieldBox label="Website URL" name="websiteUrl" type="url" required autoComplete="off" value={websiteUrl} onValueChange={setWebsiteUrl} />
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-[10px] border border-black/25 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.03] disabled:opacity-60 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        {generating ? "Generating with AI..." : "Generate using AI"}
      </button>
      <p className="-mt-2 text-xs text-black/40 dark:text-white/40">
        Fills name, description, tags, category and pricing from the website.
      </p>

      <FieldArea
        label="Description"
        name="description"
        required
        rows={4}
        value={description}
        onValueChange={setDescription}
      />

      <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
        <SelectTrigger className={boxTrigger}>
          <SelectValue />
          <span className="shrink-0 font-normal">Category</span>
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={pricing} onValueChange={(v) => setPricing(v ?? "FREEMIUM")}>
        <SelectTrigger className={boxTrigger}>
          <SelectValue />
          <span className="shrink-0 font-normal">Pricing</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="FREE">Free</SelectItem>
          <SelectItem value="FREEMIUM">Freemium</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="CONTACT">Contact sales</SelectItem>
          <SelectItem value="OPEN_SOURCE">Open source</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid gap-4 pt-1 sm:grid-cols-2">
        <CheckboxLine>Free plan available</CheckboxLine>
        <CheckboxLine>Open source</CheckboxLine>
      </div>

      <div>
        <FieldBox label="Tags" name="tags" autoComplete="off" value={tags} onValueChange={setTags} />
        <p className="mt-1.5 px-1 text-xs text-black/40 dark:text-white/40">
          Comma separated, e.g. llm, chat, productivity
        </p>
      </div>

      {paymentEnabled && (
        <p className="text-sm text-black/50 dark:text-white/50">
          Submission requires a one-time{" "}
          <span className="font-medium text-foreground">
            ${(priceCents / 100).toFixed(2)}
          </span>{" "}
          review fee, collected at checkout.
        </p>
      )}

      <SubmitButton pending={pending}>
        {pending ? (paymentEnabled ? "Redirecting to checkout..." : "Submitting...") : paymentEnabled ? "Pay & submit tool" : "Submit tool"}
      </SubmitButton>
    </form>
  );
}
