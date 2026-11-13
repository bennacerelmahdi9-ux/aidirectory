"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { aiSearchTools } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Loader2 } from "lucide-react";

/**
 * Natural-language search (#3): "free image upscaler that runs offline"
 * is parsed by AI into directory filters, then the user lands on /tools
 * with those filters applied.
 */
export function AiSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await aiSearchTools(query).catch(() => ({ ok: false as const, error: "AI search failed." }));
    setSubmitting(false);
    if (res.ok) {
      startTransition(() => router.push(res.url));
    } else {
      setError(res.error);
    }
  }

  const busy = submitting || pending;

  return (
    <form onSubmit={onSubmit} className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Describe what you need — e.g. "free image upscaler that runs offline"'
            className="h-10 w-full rounded-[10px] border border-black/25 bg-card pl-9 pr-3 text-sm placeholder:text-black/40 dark:border-white/15 dark:bg-white/5 dark:placeholder:text-white/40"
            maxLength={200}
          />
        </div>
        <Button type="submit" disabled={busy || !query.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search with AI
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </form>
  );
}
