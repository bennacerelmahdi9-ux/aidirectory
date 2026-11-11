import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/tool-card";
import { getCategories, getFeaturedTools, getRecentTools, getFreeTools, getOpenSourceTools } from "@/lib/queries";
import { Search, ArrowRight } from "lucide-react";

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, recent, free, oss] = await Promise.all([
    getCategories(),
    getFeaturedTools(8),
    getRecentTools(8),
    getFreeTools(8),
    getOpenSourceTools(8),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Discover the best AI tools
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            AIAtlas is an open-source directory to discover, compare, and explore AI tools, models, APIs, agents, and developer resources.
          </p>
          <form action="/tools" className="mx-auto mt-8 flex max-w-xl items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Search AI tools, models, APIs..." className="pl-9 h-12" />
            </div>
            <Button type="submit" size="lg">Search</Button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((c: any) => (
              <Link key={c.slug} href={`/tools?category=${c.slug}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  {c.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <Section title="Trending AI tools" href="/tools?sort=popular">
        {featured.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </Section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Popular categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c: any) => (
            <Link
              key={c.slug}
              href={`/tools?category=${c.slug}`}
              className="rounded-lg border p-4 text-center transition hover:bg-muted"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c._count.tools} tools</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently added */}
      <Section title="Recently added" href="/tools?sort=newest">
        {recent.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </Section>

      {/* Best free */}
      <Section title="Best free AI tools" href="/tools?free=1">
        {free.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </Section>

      {/* Open source */}
      <Section title="Open-source AI projects" href="/tools?openSource=1">
        {oss.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </Section>

      {/* Models */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">AI model directory</h2>
          <Link href="/models" className={buttonVariants({ variant: "ghost" })}>
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <p className="text-muted-foreground">
          Explore models from OpenAI, Anthropic, Google, Meta, Qwen, DeepSeek, Mistral, and more.
        </p>
      </section>

      {/* Resources */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Developer resources</h2>
          <Link href="/resources" className={buttonVariants({ variant: "ghost" })}>
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Community */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold">Community submissions</h2>
          <p className="mt-2 text-muted-foreground">Know an AI tool we're missing? Submit it for review.</p>
          <Link href="/submit" className={buttonVariants({ className: "mt-4" })}>
            Submit an AI tool
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={href} className={buttonVariants({ variant: "ghost" })}>
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
