import { getResources } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Developer Resources</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant="secondary">{r.type}</Badge>
                <p className="text-muted-foreground">{r.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <Badge key={t} variant="outline">#{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
