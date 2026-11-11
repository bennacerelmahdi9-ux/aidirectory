import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveTool, rejectTool, deleteTool, toggleFeatured, updateUserRole } from "@/app/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") redirect("/");

  const [tools, users, reviews, reports] = await Promise.all([
    prisma.tool.findMany({ orderBy: { createdAt: "desc" }, include: { category: true, _count: { select: { reviews: true } } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { user: true, tool: true } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, include: { tool: true, user: true } }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        <Stat label="Tools" value={tools.length} />
        <Stat label="Users" value={users.length} />
        <Stat label="Reviews" value={reviews.length} />
        <Stat label="Reports" value={reports.length} />
      </div>

      <Tabs defaultValue="tools">
        <TabsList>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/tools/${t.slug}`} className="hover:underline">{t.name}</Link>
                  </TableCell>
                  <TableCell>{t.category.name}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "APPROVED" ? "default" : t.status === "PENDING" ? "secondary" : "destructive"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.featured ? "Yes" : "No"}</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {t.status !== "APPROVED" && (
                      <form action={async () => { "use server"; await approveTool(t.id); }}>
                        <Button size="sm" type="submit">Approve</Button>
                      </form>
                    )}
                    {t.status === "APPROVED" && (
                      <form action={async () => { "use server"; await rejectTool(t.id); }}>
                        <Button size="sm" variant="outline" type="submit">Reject</Button>
                      </form>
                    )}
                    <form action={async () => { "use server"; await toggleFeatured(t.id); }}>
                      <Button size="sm" variant="outline" type="submit">Toggle featured</Button>
                    </form>
                    <form action={async () => { "use server"; await deleteTool(t.id); }}>
                      <Button size="sm" variant="destructive" type="submit">Delete</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="users">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name ?? "—"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell className="flex gap-1">
                    <form action={async () => { "use server"; await updateUserRole(u.id, "USER"); }}>
                      <Button size="sm" variant="outline" type="submit">User</Button>
                    </form>
                    <form action={async () => { "use server"; await updateUserRole(u.id, "MODERATOR"); }}>
                      <Button size="sm" variant="outline" type="submit">Mod</Button>
                    </form>
                    <form action={async () => { "use server"; await updateUserRole(u.id, "ADMIN"); }}>
                      <Button size="sm" variant="outline" type="submit">Admin</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="reviews">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.user.name ?? r.user.email}</TableCell>
                  <TableCell>{r.tool.name}</TableCell>
                  <TableCell>{r.rating}/5</TableCell>
                  <TableCell className="max-w-xs truncate">{r.comment ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="reports">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.tool.name}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
