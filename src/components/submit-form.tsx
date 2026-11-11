"use client";

import { useState } from "react";
import {
  FieldBox,
  FieldArea,
  CheckboxLine,
  SubmitButton,
} from "@/components/ui/auth-section-1";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitTool } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const boxTrigger =
  "flex h-14 w-full items-center justify-between gap-4 rounded-[10px] border border-black/25 bg-card px-5 text-lg leading-none transition-colors focus-visible:border-black/60 focus-visible:ring-0 dark:border-white/15 dark:bg-white/5 dark:focus-visible:border-white/40 xl:text-xl";

export function SubmitForm({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pricing, setPricing] = useState("FREEMIUM");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("categoryId", categoryId);
    fd.set("pricingModel", pricing);
    setPending(true);
    const res = await submitTool(fd);
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
        <FieldBox label="Tool name" name="name" required autoComplete="off" />
        <FieldBox label="Website URL" name="websiteUrl" type="url" required autoComplete="off" />
      </div>

      <FieldArea label="Description" name="description" required rows={4} />

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
        <FieldBox label="Tags" name="tags" autoComplete="off" />
        <p className="mt-1.5 px-1 text-xs text-black/40 dark:text-white/40">
          Comma separated, e.g. llm, chat, productivity
        </p>
      </div>

      <SubmitButton pending={pending}>
        {pending ? "Submitting..." : "Submit tool"}
      </SubmitButton>
    </form>
  );
}
