import Link from "next/link";
import { markToolPaidBySession } from "@/app/actions";
import { paymentEnabled } from "@/lib/stripe";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SubmitSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  // Verify the payment directly with Stripe so the flow also works in the
  // sandbox without a webhook listener.
  let paid = false;
  let toolSlug: string | undefined;
  if (paymentEnabled() && sessionId) {
    const res = await markToolPaidBySession(sessionId).catch(() => ({ ok: false as const, error: "Verification failed." }));
    paid = res.ok;
    if (res.ok) toolSlug = res.toolSlug;
  }

  return (
    <div className="container mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary ring-1 ring-primary/20">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        {paid ? "Payment received" : "Almost there"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {paid
          ? "Your tool has been submitted and is now waiting for moderator review. You'll find it on the tools page once approved."
          : "We couldn't verify the payment for this submission. If you completed checkout, the webhook will mark it as paid shortly — you can also try reopening the link from Stripe."}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/tools" className={buttonVariants()}>
          Browse tools
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          My dashboard
        </Link>
      </div>
      {toolSlug ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Reference: <span className="font-mono">{toolSlug}</span>
        </p>
      ) : null}
    </div>
  );
}
