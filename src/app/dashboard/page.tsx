import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBookmarksByUser } from "@/lib/queries";
import { ToolCard } from "@/components/tool-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookmarks = await getBookmarksByUser(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your bookmarks</h1>
      {bookmarks.length === 0 ? (
        <p className="text-muted-foreground">No bookmarks yet.</p>
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
