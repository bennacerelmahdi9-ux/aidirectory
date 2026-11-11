import { getCategories } from "@/lib/queries";
import { SubmitForm } from "@/components/submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const categories = await getCategories();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 lg:py-16">
      <div className="rounded-2xl border border-black/20 bg-card px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:px-14">
        <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          Submit an AI tool
        </h1>
        <p className="mt-3 text-lg leading-snug text-black/60 dark:text-white/55">
          The favicon is fetched automatically from the website as the logo.
        </p>
        <div className="mt-10">
          <SubmitForm categories={categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))} />
        </div>
      </div>
    </div>
  );
}
