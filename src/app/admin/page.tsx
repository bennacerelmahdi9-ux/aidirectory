import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/stripe";
import { SETTING_KEYS, getSettings, maskSecret } from "@/lib/settings";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSettings } from "@/components/admin-settings";
import {
  approveTool,
  rejectTool,
  deleteTool,
  toggleFeatured,
  updateUserRole,
  deleteUser,
} from "@/app/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") redirect("/");
  const isAdmin = session.user.role === "ADMIN";

  const [
    tools,
    users,
    reviews,
    reports,
    paidCount,
    stripe,
    settings,
  ] = await Promise.all([
    prisma.tool.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, _count: { select: { reviews: true } } },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { user: true, tool: true } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, include: { tool: true, user: true } }),
    prisma.tool.count({ where: { paidAt: { not: null } } }),
    getStripeConfig(),
    getSettings(),
  ]);

  const pendingTools = tools.filter((t) => t.status === "PENDING" || t.status === "PENDING_PAYMENT");
  const approvedTools = tools.filter((t) => t.status === "APPROVED");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin panel</h1>
        <Badge variant={stripe.enabled ? "default" : "secondary"}>
          Payments {stripe.enabled ? "on" : "off"} · {stripe.mode === "live" ? "live" : "sandbox"}
        </Badge>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tools">Tools{pendingTools.length > 0 ? ` (${pendingTools.length})` : ""}</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Total tools" value={tools.length} />
            <Stat label="Awaiting review" value={pendingTools.length} highlight={pendingTools.length > 0} />
            <Stat label="Published" value={approvedTools.length} />
            <Stat label="Users" value={users.length} />
            <Stat label="Reviews" value={reviews.length} />
            <Stat label="Open reports" value={reports.filter((r) => r.status === "OPEN").length} />
            <Stat label="Paid submissions" value={paidCount} />
            <Stat
              label="Review fee"
              value={`$${(stripe.priceCents / 100).toFixed(2)}`}
              hint={stripe.enabled ? `Stripe ${stripe.mode} mode` : "Payments off"}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold tracking-tight">Review queue</h3>
              {pendingTools.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nothing waiting. All clear.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {pendingTools.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link href={`/tools/${t.slug}`} className="truncate hover:underline">{t.name}</Link>
                      <Badge variant="secondary">{t.status === "PENDING_PAYMENT" ? "awaiting payment" : "pending"}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold tracking-tight">Configuration</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Stripe: {stripe.mode === "live" ? "live" : "sandbox"} mode, {stripe.secretKey ? "key configured" : "no key"}</li>
                <li>OpenRouter: {settings[SETTING_KEYS.openrouterApiKey] ? "key configured" : "no key"}, model <code className="font-mono text-xs">{settings[SETTING_KEYS.openrouterModel]}</code></li>
                <li>Submission fee: ${(stripe.priceCents / 100).toFixed(2)}</li>
                <li>Masked test key: {maskSecret(settings[SETTING_KEYS.stripeSecretTest]) || "—"}</li>
              </ul>
              {isAdmin && (
                <Link href="#" className="mt-3 inline-block text-sm text-primary hover:underline" />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tools */}
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
                    <Badge variant={t.status === "APPROVED" ? "default" : t.status === "REJECTED" ? "destructive" : "secondary"}>
                      {t.status === "PENDING_PAYMENT" ? "awaiting payment" : t.status.toLowerCase()}
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
                      <Button size="sm" variant="outline" type="submit">Feature</Button>
                    </form>
                    {isAdmin && (
                      <form action={async () => { "use server"; await deleteTool(t.id); }}>
                        <Button size="sm" variant="destructive" type="submit">Delete</Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name ?? "—"}</TableCell>
                  <TableCell className="max-w-52 truncate">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : u.role === "MODERATOR" ? "secondary" : "outline"}>
                      {u.role.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {isAdmin && (
                      <>
                        {(["USER", "MODERATOR", "ADMIN"] as const).map((role) => (
                          <form key={role} action={async () => { "use server"; await updateUserRole(u.id, role); }}>
                            <Button size="sm" variant={u.role === role ? "default" : "outline"} type="submit">
                              {role === "MODERATOR" ? "Mod" : role.charAt(0) + role.slice(1).toLowerCase()}
                            </Button>
                          </form>
                        ))}
                        {u.id !== session.user.id && (
                          <form action={async () => { "use server"; await deleteUser(u.id); }}>
                            <Button size="sm" variant="destructive" type="submit">Delete</Button>
                          </form>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Reviews */}
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

        {/* Reports */}
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
                  <TableCell>
                    <Badge variant={r.status === "OPEN" ? "destructive" : "secondary"}>{r.status.toLowerCase()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Settings */}
        {isAdmin && (
          <TabsContent value="settings">
            <AdminSettings
              data={{
                isAdmin,
                paymentEnabled: stripe.enabled,
                priceDollars: (stripe.priceCents / 100).toFixed(2),
                stripeMode: stripe.mode,
                stripeSecretTest: maskSecret(settings[SETTING_KEYS.stripeSecretTest]),
                stripeSecretLive: maskSecret(settings[SETTING_KEYS.stripeSecretLive]),
                stripeWebhookTest: maskSecret(settings[SETTING_KEYS.stripeWebhookTest]),
                stripeWebhookLive: maskSecret(settings[SETTING_KEYS.stripeWebhookLive]),
                openrouterApiKey: maskSecret(settings[SETTING_KEYS.openrouterApiKey]),
                openrouterModel: settings[SETTING_KEYS.openrouterModel],
                stripeConfigured: !!stripe.secretKey,
                aiConfigured: !!settings[SETTING_KEYS.openrouterApiKey],
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Stat({ label, value, highlight, hint }: { label: string; value: number | string; highlight?: boolean; hint?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
