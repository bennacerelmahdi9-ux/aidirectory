import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/stripe";
import { SETTING_KEYS, getSettings, maskSecret } from "@/lib/settings";
import {
  approveTool,
  rejectTool,
  deleteTool,
  toggleFeatured,
  updateUserRole,
  deleteUser,
  createCategory,
  deleteCategory,
} from "@/app/actions";
import { AdminClientView } from "@/components/admin-client-view";

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
    categories,
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
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { tools: true } } },
    }),
  ]);

  const settingsData = {
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
  };

  return (
    <AdminClientView
      isAdmin={isAdmin}
      userRole={session.user.role}
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? ""}
      userId={session.user.id}
      tools={tools}
      users={users}
      reviews={reviews}
      reports={reports}
      categories={categories}
      paidCount={paidCount}
      stripe={stripe}
      settingsData={settingsData}
      approveToolAction={approveTool}
      rejectToolAction={rejectTool}
      toggleFeaturedAction={toggleFeatured}
      deleteToolAction={deleteTool}
      updateUserRoleAction={updateUserRole}
      deleteUserAction={deleteUser}
      createCategoryAction={createCategory}
      deleteCategoryAction={deleteCategory}
    />
  );
}
