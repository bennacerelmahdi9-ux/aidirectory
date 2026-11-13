import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBookmarksByUser } from "@/lib/queries";
import { ToolCard } from "@/components/tool-card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // If user is Admin or Moderator, automatically direct them to the Admin Panel
  if (session.user.role === "ADMIN" || session.user.role === "MODERATOR") {
    redirect("/admin");
  }

  const bookmarks = await getBookmarksByUser(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">No bookmarks yet.</p>
          <Link href="/tools" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Explore tools
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bookmarks.map((b) => (
            <ToolCard key={b.id} tool={b.tool} />
          ))}
        </div>
      )}
    </div>
  );
}
