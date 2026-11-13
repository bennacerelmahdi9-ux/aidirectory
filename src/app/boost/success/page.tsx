import Link from "next/link";
import { markBoostPaidBySession } from "@/app/actions";
import { getStripeConfig } from "@/lib/stripe";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/** Stripe Checkout return URL for paid boosts. Verifies the payment server-side. */
export default async function BoostSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id ?? "";

  let boosted = false;
  let toolSlug: string | undefined;
  let error: string | undefined;

  const config = await getStripeConfig();
  if (config.secretKey && sessionId) {
    const res = await markBoostPaidBySession(sessionId).catch(() => ({ ok: false as const, error: "Something went wrong." }));
    if (res.ok) {
      boosted = true;
      toolSlug = res.toolSlug;
    } else {
      error = res.error;
    }
  } else {
    error = "Missing checkout session.";
  }

  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <Card className="w-full">
        <CardContent className="p-8">
          {boosted ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Boost activated 🚀</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your tool now has sponsored placement at the top of the directory.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                {toolSlug && (
                  <Link href={`/tools/${toolSlug}`} className={buttonVariants()}>
                    View tool page
                  </Link>
                )}
                <Link href="/tools" className={buttonVariants({ variant: "outline" })}>
                  Browse directory
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Boost could not be confirmed</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error ?? "Something went wrong."}</p>
              <div className="mt-6 flex justify-center">
                <Link href="/tools" className={buttonVariants({ variant: "outline" })}>
                  Back to directory
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
