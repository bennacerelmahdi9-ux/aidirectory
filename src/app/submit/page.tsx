import { getCategories } from "@/lib/queries";
import { SubmitForm } from "@/components/submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const categories = await getCategories();
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Submit an AI tool</h1>
      <SubmitForm categories={categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
