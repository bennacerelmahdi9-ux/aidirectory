import Link from "next/link";
import { GridPulse } from "@/components/ui/grid-pulse";
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/tool-card";
import { getCategories, getFeaturedTools, getRecentTools, getFreeTools, getOpenSourceTools, getAllApprovedTools } from "@/lib/queries";
import { Search, ArrowRight } from "lucide-react";

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, recent, free, oss, allTools] = await Promise.all([
    getCategories(),
    getFeaturedTools(8),
    getRecentTools(8),
    getFreeTools(8),
    getOpenSourceTools(8),
    getAllApprovedTools(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden bg-background">
        <GridPulse />
        <div className="relative z-10 container mx-auto px-4 py-24 text-center md:py-32">
          <h1
            data-grid-avoid
            className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl [text-shadow:0_0_6px_var(--color-background),0_0_14px_var(--color-background),0_0_30px_var(--color-background),0_0_52px_var(--color-background)]"
          >
            Discover the best AI tools
          </h1>
          <p
            data-grid-avoid
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl [text-shadow:0_0_6px_var(--color-background),0_0_14px_var(--color-background),0_0_30px_var(--color-background),0_0_52px_var(--color-background)]"
          >
            AIAtlas is an open-source directory to discover, compare, and explore AI tools, models, APIs, agents, and developer resources.
          </p>
          <form action="/tools" className="mx-auto mt-10 flex max-w-2xl items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Search AI tools, models, APIs..." className="h-14 rounded-xl pl-12 text-base shadow-sm bg-background dark:bg-background" />
            </div>
            <Button type="submit" size="lg" className="h-14 rounded-xl px-8">Search</Button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((c) => (
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
          {categories.map((c) => (
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

      {/* Community / submit CTA */}
      <AnimatedMarqueeHero
        tagline="Open source & community driven"
        title="Built a great AI tool?"
        description="Share it with the community. Submissions are reviewed and published with their favicon as the logo — free and open source."
        ctaText="Submit your tool"
        ctaHref="/submit"
        items={allTools.map((t) => (
          <div
            key={t.slug}
            className="flex h-full w-40 md:w-52 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-md"
          >
            <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-background ring-1 ring-border/60">
              {t.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.logo} alt={t.name} className="h-9 w-9 md:h-10 md:w-10 object-contain" />
              ) : (
                <span className="text-xl font-bold text-primary">{t.name.charAt(0)}</span>
              )}
            </div>
            <div className="max-w-full truncate text-sm font-medium text-foreground">{t.name}</div>
          </div>
        ))}
        className="border-t"
      />
    </div>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <Link href={href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
