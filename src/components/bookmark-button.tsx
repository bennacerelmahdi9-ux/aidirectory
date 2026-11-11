"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toggleBookmark } from "@/app/actions";
import { toast } from "sonner";

export function BookmarkButton({ toolId, toolSlug }: { toolId: string; toolSlug: string }) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const res = await toggleBookmark(toolId);
    setPending(false);
    if (!res.ok) toast.error(res.error ?? "Failed");
    else toast.success("Bookmark updated");
  }

  return (
    <Button variant="outline" size="icon" onClick={onClick} disabled={pending} aria-label="Bookmark">
      <Bookmark className="h-4 w-4" />
    </Button>
  );
}
