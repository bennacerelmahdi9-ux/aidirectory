"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startToolBoost } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";

/**
 * Paid boost (#12): sends the tool owner to Stripe Checkout for a
 * sponsored placement. Only rendered when the viewer owns the tool.
 */
export function BoostButton({ toolId, priceDollars, days }: { toolId: string; priceDollars: string; days: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    const res = await startToolBoost(toolId).catch(() => ({ ok: false as const, error: "Something went wrong." }));
    if (res.ok && res.checkoutUrl) {
      router.push(res.checkoutUrl);
    } else {
      setLoading(false);
      setError(("error" in res && res.error) || "Could not start checkout.");
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={start} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        Boost this tool — ${priceDollars}/{days}d
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
