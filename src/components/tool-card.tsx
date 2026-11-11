import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRICING_LABELS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

type ToolWithCategory = Prisma.ToolGetPayload<{ include: { category: true } }>;

export function ToolCard({ tool }: { tool: ToolWithCategory }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="group block">
      <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
            {tool.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.logo} alt={tool.name} className="h-8 w-8 rounded object-contain" />
            ) : (
              tool.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{tool.name}</div>
            <div className="text-xs text-muted-foreground truncate">{tool.category.name}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{PRICING_LABELS[tool.pricingModel] ?? tool.pricingModel}</Badge>
            {tool.hasFreePlan && <Badge variant="outline">Free plan</Badge>}
            {tool.isOpenSource && <Badge variant="outline">Open source</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
