"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitTool } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Tool name *</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Description *</Label>
        <Textarea name="description" required />
      </div>
      <div>
        <Label>Website URL *</Label>
        <Input name="websiteUrl" type="url" required />
      </div>
      <div>
        <Label>Category *</Label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Pricing</Label>
        <Select value={pricing} onValueChange={(v) => setPricing(v ?? "FREEMIUM")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="FREEMIUM">Freemium</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="CONTACT">Contact sales</SelectItem>
            <SelectItem value="OPEN_SOURCE">Open source</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hasFreePlan" /> Free plan available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isOpenSource" /> Open source
        </label>
      </div>
      <div>
        <Label>Tags (comma separated)</Label>
        <Input name="tags" placeholder="llm, chat, productivity" />
      </div>
      <Button type="submit" disabled={pending}>Submit</Button>
    </form>
  );
}
