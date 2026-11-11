import { getCategories } from "@/lib/queries";
import { SubmitForm } from "@/components/submit-form";
import { getStripeConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const [categories, config] = await Promise.all([getCategories(), getStripeConfig()]);
  const paid = config.enabled;
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-black/20 bg-card px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:px-14">
          <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
            Submit an AI tool
          </h1>
          <p className="mt-3 text-lg leading-snug text-black/60 dark:text-white/55">
            The favicon is fetched automatically from the website as the logo.
          </p>
          <div className="mt-10">
            <SubmitForm
              categories={categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))}
              paymentEnabled={paid}
              priceCents={config.priceCents}
            />
          </div>
          {paid ? (
            <p className="mt-6 text-xs text-black/40 dark:text-white/40">
              Payments run through Stripe in {config.mode === "live" ? "live" : "sandbox (test)"} mode.
            </p>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-black/20 bg-card p-6 dark:border-white/10 dark:bg-[#0a0a0a]">
            <h2 className="font-semibold tracking-tight">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {[
                { title: "Submit", text: "Fill the form — the AI button can draft it for you from the website URL." },
                { title: "Review", text: "A moderator checks the tool, description and link, usually within a few days." },
                { title: "Published", text: "Approved tools appear on the tools page with their favicon as the logo." },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{step.text}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-black/20 bg-card p-6 dark:border-white/10 dark:bg-[#0a0a0a]">
            <h2 className="font-semibold tracking-tight">Submission guidelines</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Submit real, working AI tools — the website URL must be live.",
                "Write a clear, honest description; no keyword stuffing.",
                "Avoid duplicates — search the directory before submitting.",
                "Tags should be short and lowercase, e.g. llm, chat, productivity.",
              ].map((rule) => (
                <li key={rule} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
