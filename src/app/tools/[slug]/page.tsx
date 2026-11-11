import { notFound } from "next/navigation";
import { getToolBySlug, incrementView } from "@/lib/queries";
import { PRICING_LABELS, PLATFORMS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookmarkButton } from "@/components/bookmark-button";
import { ReviewForm } from "@/components/review-form";
import { Star } from "lucide-react";
import { looksLikeHtml } from "@/lib/utils";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: tool.name,
      description: tool.description,
      url: `/tools/${tool.slug}`,
    },
  };
}

export default async function ToolDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool || tool.status !== "APPROVED") notFound();

  incrementView(slug);

  const avgRating =
    tool.reviews.length > 0
      ? tool.reviews.reduce((a, r) => a + r.rating, 0) / tool.reviews.length
      : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-2xl font-bold">
            {tool.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tool.logo} alt={tool.name} className="h-12 w-12 rounded object-contain" />
            ) : (
              tool.name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tool.name}</h1>
            <p className="text-muted-foreground">{tool.category.name}</p>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({tool.reviews.length} reviews)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BookmarkButton toolId={tool.id} toolSlug={tool.slug} />
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            Visit website
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{PRICING_LABELS[tool.pricingModel]}</Badge>
        {tool.hasFreePlan && <Badge variant="outline">Free plan</Badge>}
        {tool.isOpenSource && <Badge variant="outline">Open source</Badge>}
        {tool.platforms.map((p) => (
          <Badge key={p} variant="outline">{p}</Badge>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{tool.description}</p>
              {tool.longDescription && (
                looksLikeHtml(tool.longDescription) ? (
                  <div
                    className="rich-editor mt-4 text-muted-foreground [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: tool.longDescription }}
                  />
                ) : (
                  <p className="mt-4 text-muted-foreground whitespace-pre-line">{tool.longDescription}</p>
                )
              )}
              {tool.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tool.tags.map((t) => (
                    <Badge key={t} variant="secondary">#{t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {tool.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {tool.screenshots.map((s, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={s} alt={`${tool.name} screenshot ${i + 1}`} className="rounded-lg border" />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first.</p>
              )}
              {tool.reviews.map((r) => (
                <div key={r.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.user.name ?? "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
              <ReviewForm toolId={tool.id} toolSlug={tool.slug} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pricing</span>
                <span>{PRICING_LABELS[tool.pricingModel]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free plan</span>
                <span>{tool.hasFreePlan ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open source</span>
                <span>{tool.isOpenSource ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last verified</span>
                <span>{tool.lastVerifiedAt ? new Date(tool.lastVerifiedAt).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views</span>
                <span>{tool.viewCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {tool.platforms.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                tool.platforms.map((p) => <Badge key={p} variant="outline">{p}</Badge>)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
