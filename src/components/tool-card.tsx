import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_LABELS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

type ToolWithCategory = Prisma.ToolGetPayload<{ include: { category: true } }>;

export function ToolCard({ tool }: { tool: ToolWithCategory }) {
  const boosted = tool.boostedUntil ? tool.boostedUntil > new Date() : false;

  return (
    <Link href={`/tools/${tool.slug}`} className="group block">
      <Card className={`relative h-full overflow-hidden border-border/60 bg-card/80 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 ${boosted ? "border-primary/40" : ""}`}>
        {boosted && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
            Sponsored
          </span>
        )}
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold text-primary ring-1 ring-primary/10">
            {tool.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.logo} alt={tool.name} className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              tool.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate group-hover:text-primary transition-colors">{tool.name}</div>
            <div className="text-xs text-muted-foreground truncate">{tool.category.name}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{tool.description}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">{PRICING_LABELS[tool.pricingModel] ?? tool.pricingModel}</Badge>
            {tool.hasFreePlan && <Badge variant="outline" className="text-xs">Free plan</Badge>}
            {tool.isOpenSource && <Badge variant="outline" className="text-xs">Open source</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
