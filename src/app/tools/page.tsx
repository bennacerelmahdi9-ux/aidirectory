import { ToolCard } from "@/components/tool-card";
import { getTools, getCategories } from "@/lib/queries";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRICING_LABELS } from "@/lib/constants";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  pricing?: string;
  free?: string;
  openSource?: string;
  sort?: string;
  page?: string;
}>;

export default async function ToolsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    category: sp.category,
    pricing: sp.pricing,
    free: sp.free === "1",
    openSource: sp.openSource === "1",
    sort: sp.sort ?? "popular",
    page: sp.page ? Number(sp.page) : 1,
  };

  const [result, categories] = await Promise.all([getTools(filters), getCategories()]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && v !== "0") params.set(k, v);
    }
    return `/tools?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI Tools Directory</h1>

      {/* Search + filters */}
      <form action="/tools" className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search..." className="pl-9" />
        </div>
        <select name="category" defaultValue={sp.category ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((c: any) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="pricing" defaultValue={sp.pricing ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">All pricing</option>
          {Object.entries(PRICING_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="free" value="1" defaultChecked={sp.free === "1"} /> Free only
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="openSource" value="1" defaultChecked={sp.openSource === "1"} /> Open source
        </label>
        <select name="sort" defaultValue={sp.sort ?? "popular"} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="updated">Recently updated</option>
          <option value="name">Name (A-Z)</option>
        </select>
        <Button type="submit">Apply</Button>
      </form>

      <div className="mb-4 text-sm text-muted-foreground">
        {result.total} tools found
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {result.items.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {result.page > 1 && (
          <Link href={buildUrl({ page: String(result.page - 1) })} className={buttonVariants({ variant: "outline" })}>
            Previous
          </Link>
        )}
        <span className="text-sm text-muted-foreground">
          Page {result.page} of {result.totalPages || 1}
        </span>
        {result.page < result.totalPages && (
          <Link href={buildUrl({ page: String(result.page + 1) })} className={buttonVariants({ variant: "outline" })}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
