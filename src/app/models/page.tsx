import { getModels } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const models = await getModels();
  const byProvider = models.reduce<Record<string, typeof models>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI Models Directory</h1>
      <div className="space-y-8">
        {Object.entries(byProvider).map(([provider, list]) => (
          <section key={provider}>
            <h2 className="text-xl font-semibold mb-3">{provider}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <Link key={m.slug} href={`/models/${m.slug}`} className="block">
                  <Card className="h-full transition hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">{m.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground line-clamp-2">{m.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.capabilities.map((c) => (
                          <Badge key={c} variant="secondary">{c}</Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Context: {m.contextLength ? m.contextLength.toLocaleString() : "—"} tokens
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
