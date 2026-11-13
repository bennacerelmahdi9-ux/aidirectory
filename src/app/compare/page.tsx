import { getTools, getToolBySlug } from "@/lib/queries";
import { AiCompare } from "@/components/ai-compare";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_LABELS } from "@/lib/constants";
import Link from "next/link";

type SP = Promise<{ ids?: string }>;

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const slugs = (sp.ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const tools = await Promise.all(slugs.map((s) => getToolBySlug(s)));
  const valid = tools.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getToolBySlug>>>[];

  const all = await getTools({ pageSize: 100 });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Compare AI Tools</h1>

      <form action="/compare" className="mb-6 flex flex-wrap items-center gap-2">
        <select name="ids" className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={sp.ids ?? ""}>
          <option value="">Select tools (comma-separated slugs)</option>
        </select>
        <p className="text-sm text-muted-foreground">
          Add tool slugs separated by commas, e.g. chatgpt,claude,gemini
        </p>
      </form>

      <form action="/compare" className="mb-8 flex gap-2">
        <input
          name="ids"
          defaultValue={sp.ids ?? ""}
          placeholder="chatgpt,claude,gemini"
          className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm text-primary-foreground">Compare</button>
      </form>

      {valid.length > 0 && (
        <>
          <AiCompare ids={valid.map((t) => t.slug).join(",")} />
          <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Attribute</th>
                {valid.map((t) => (
                  <th key={t.slug} className="p-2 text-left">
                    <Link href={`/tools/${t.slug}`} className="font-semibold hover:underline">{t.name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2 font-medium">Category</td>
                {valid.map((t) => <td key={t.slug} className="p-2">{t.category.name}</td>)}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium">Pricing</td>
                {valid.map((t) => <td key={t.slug} className="p-2">{PRICING_LABELS[t.pricingModel]}</td>)}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium">Free plan</td>
                {valid.map((t) => <td key={t.slug} className="p-2">{t.hasFreePlan ? "Yes" : "No"}</td>)}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium">Open source</td>
                {valid.map((t) => <td key={t.slug} className="p-2">{t.isOpenSource ? "Yes" : "No"}</td>)}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium">Platforms</td>
                {valid.map((t) => <td key={t.slug} className="p-2">{t.platforms.join(", ") || "—"}</td>)}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium">Rating</td>
                {valid.map((t) => {
                  const avg = t.reviews.length ? t.reviews.reduce((a, r) => a + r.rating, 0) / t.reviews.length : 0;
                  return <td key={t.slug} className="p-2">{avg.toFixed(1)} ({t.reviews.length})</td>;
                })}
              </tr>
              <tr className="border-t">
                <td className="p-2 font-medium">Website</td>
                {valid.map((t) => (
                  <td key={t.slug} className="p-2">
                    <a href={t.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Visit</a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
        </>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Available tools</h2>
        <div className="flex flex-wrap gap-2">
          {all.items.map((t) => (
            <Link key={t.slug} href={`/compare?ids=${t.slug}`} className="text-xs rounded border px-2 py-1 hover:bg-muted">
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
