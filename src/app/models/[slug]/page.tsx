import { notFound } from "next/navigation";
import { getModelBySlug } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const m = await getModelBySlug(slug);
  if (!m) return {};
  return { title: m.name, description: m.description };
}

export default async function ModelDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const m = await getModelBySlug(slug);
  if (!m) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold">{m.name}</h1>
      <p className="text-muted-foreground">{m.provider}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {m.capabilities.map((c) => (
          <Badge key={c} variant="secondary">{c}</Badge>
        ))}
        {m.isOpenSource && <Badge variant="outline">Open source</Badge>}
        {m.apiAvailable && <Badge variant="outline">API available</Badge>}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Context length</span>
              <span>{m.contextLength ? m.contextLength.toLocaleString() + " tokens" : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span>{m.license ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open source</span>
              <span>{m.isOpenSource ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API available</span>
              <span>{m.apiAvailable ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last verified</span>
              <span>{m.lastVerifiedAt ? new Date(m.lastVerifiedAt).toLocaleDateString() : "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{m.description}</p>
            <div className="mt-4 flex gap-2">
              {m.docsUrl && (
                <a href={m.docsUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
                  Documentation
                </a>
              )}
              {m.websiteUrl && (
                <a href={m.websiteUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
                  Website
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
