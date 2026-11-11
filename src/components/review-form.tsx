"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addReview } from "@/app/actions";
import { toast } from "sonner";

export function ReviewForm({ toolId, toolSlug }: { toolId: string; toolSlug: string }) {
  const [rating, setRating] = useState(5);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("toolId", toolId);
    fd.set("toolSlug", toolSlug);
    fd.set("rating", String(rating));
    setPending(true);
    const res = await addReview(fd);
    setPending(false);
    if (!res.ok) toast.error(res.error ?? "Failed");
    else {
      toast.success("Review saved");
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t pt-4">
      <div>
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={n <= rating ? "text-yellow-400" : "text-muted-foreground"}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <Textarea name="comment" placeholder="Share your experience..." />
      <Button type="submit" disabled={pending}>Submit review</Button>
    </form>
  );
}
