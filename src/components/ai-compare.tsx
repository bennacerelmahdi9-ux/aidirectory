"use client";

import { useState } from "react";
import { aiCompareTools } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

/**
 * AI comparison (#1): asks OpenRouter for a narrative comparison of the
 * tools on /compare. Clearly labeled as AI-generated.
 */
export function AiCompare({ ids }: { ids: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setError(null);
    setLoading(true);
    const res = await aiCompareTools(ids).catch(() => ({ ok: false as const, error: "AI comparison failed." }));
    setLoading(false);
    if (res.ok) setText(res.text);
    else setError(res.error);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={generate} disabled={loading || ids.split(",").filter(Boolean).length < 2}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate with AI
        </Button>
        <span className="text-xs text-muted-foreground">Narrative comparison of the tools above</span>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {text && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-generated comparison
            </span>
            <span className="text-[10px] text-muted-foreground">May contain mistakes — verify on the tools' sites</span>
          </div>
          <div className="space-y-3 text-sm leading-relaxed">
            {text
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p.replace(/^- /, "").trim()}</p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
