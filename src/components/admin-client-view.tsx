"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  Users,
  MessageSquare,
  AlertTriangle,
  Settings,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
  Shield,
  KeyRound,
  Eye,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSettings } from "@/components/admin-settings";

type AdminClientViewProps = {
  isAdmin: boolean;
  userRole: string;
  userName: string | null;
  userEmail: string;
  userId: string;
  tools: any[];
  users: any[];
  reviews: any[];
  reports: any[];
  categories: any[];
  paidCount: number;
  stripe: {
    enabled: boolean;
    mode: string;
    priceCents: number;
    secretKey?: string | null;
  };
  settingsData: any;
  approveToolAction: (id: string) => Promise<any>;
  rejectToolAction: (id: string) => Promise<any>;
  toggleFeaturedAction: (id: string) => Promise<any>;
  deleteToolAction: (id: string) => Promise<any>;
  updateUserRoleAction: (id: string, role: "USER" | "MODERATOR" | "ADMIN") => Promise<any>;
  deleteUserAction: (id: string) => Promise<any>;
  createCategoryAction: (formData: FormData) => Promise<any>;
  deleteCategoryAction: (id: string) => Promise<any>;
};

export function AdminClientView({
  isAdmin,
  userRole,
  userName,
  userEmail,
  userId,
  tools,
  users,
  reviews,
  reports,
  categories,
  paidCount,
  stripe,
  settingsData,
  approveToolAction,
  rejectToolAction,
  toggleFeaturedAction,
  deleteToolAction,
  updateUserRoleAction,
  deleteUserAction,
  createCategoryAction,
  deleteCategoryAction,
}: AdminClientViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "tools" | "categories" | "users" | "reviews" | "reports" | "settings"
  >("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  const pendingTools = tools.filter(
    (t) => t.status === "PENDING" || t.status === "PENDING_PAYMENT"
  );
  const approvedTools = tools.filter((t) => t.status === "APPROVED");
  const openReports = reports.filter((r) => r.status === "OPEN");

  type NavItem = {
    id: "overview" | "tools" | "categories" | "users" | "reviews" | "reports" | "settings";
    label: string;
    icon: any;
    badge?: number;
    count?: number;
  };

  const navItems: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "tools",
      label: "Tools",
      icon: Wrench,
      badge: pendingTools.length > 0 ? pendingTools.length : undefined,
    },
    { id: "categories", label: "Categories", icon: FolderTree, count: categories.length },
    { id: "users", label: "User Manager", icon: Users, count: users.length },
    { id: "reviews", label: "Reviews", icon: MessageSquare, count: reviews.length },
    {
      id: "reports",
      label: "Reports",
      icon: AlertTriangle,
      badge: openReports.length > 0 ? openReports.length : undefined,
    },
    ...(isAdmin
      ? [{ id: "settings" as const, label: "Stripe & API Keys", icon: KeyRound }]
      : []),
  ];

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setIsSubmittingCat(true);
    const fd = new FormData();
    fd.append("name", categoryName);
    fd.append("description", categoryDesc);
    await createCategoryAction(fd);
    setCategoryName("");
    setCategoryDesc("");
    setIsSubmittingCat(false);
  }

  // Filter tools
  const filteredTools = tools.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter users
  const filteredUsers = users.filter((u) =>
    (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card backdrop-blur-md transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Admin Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Admin Hub</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                {userRole.toLowerCase()} Mode
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                      active
                        ? "bg-primary-foreground text-primary"
                        : "bg-destructive text-destructive-foreground animate-pulse"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.badge === undefined && (
                  <span
                    className={`text-xs ${
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              Stripe: {stripe.mode === "live" ? "Live" : "Sandbox"}
            </span>
            <Badge variant={stripe.enabled ? "default" : "outline"} className="text-[10px] ml-auto h-5 px-1.5">
              {stripe.enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5 text-xs">
            <div className="font-medium text-foreground truncate">{userName ?? "Administrator"}</div>
            <div className="text-muted-foreground truncate text-[11px]">{userEmail}</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-8 bg-card/60 backdrop-blur-sm sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              <span>View Public Site</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Tools</span>
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-extrabold">{tools.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="text-emerald-500 font-semibold">{approvedTools.length} published</span>
                    <span>•</span>
                    <span>{pendingTools.length} pending</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Awaiting Review</span>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-500">{pendingTools.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {pendingTools.length === 0 ? "Review queue is clear" : "Action required"}
                  </div>
                </div>

                <div className="p-5 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Total Registered Users</span>
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-extrabold">{users.length}</div>
                  <div className="text-xs text-muted-foreground">Community accounts</div>
                </div>

                <div className="p-5 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                    <span>Submissions Revenue</span>
                    <CreditCard className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${((paidCount * stripe.priceCents) / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {paidCount} paid @ ${(stripe.priceCents / 100).toFixed(2)} fee
                  </div>
                </div>
              </div>

              {/* Quick Action Rows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending tools queue */}
                <div className="rounded-xl border bg-card/60 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base">Pending Submissions</h3>
                      <p className="text-xs text-muted-foreground">New tools waiting for approval</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("tools")}
                    >
                      View All
                    </Button>
                  </div>

                  {pendingTools.length === 0 ? (
                    <div className="py-10 text-center border rounded-lg border-dashed text-muted-foreground text-sm">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      All submissions reviewed. No pending tools!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingTools.slice(0, 5).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{t.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              Category: {t.category?.name ?? "General"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={t.status === "PENDING_PAYMENT" ? "secondary" : "default"}>
                              {t.status === "PENDING_PAYMENT" ? "Awaiting Pay" : "Review"}
                            </Badge>
                            <form action={async () => { await approveToolAction(t.id); }}>
                              <Button size="sm" className="h-7 text-xs">Approve</Button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stripe & System Health */}
                <div className="rounded-xl border bg-card/60 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base">Payment & API Configuration</h3>
                      <p className="text-xs text-muted-foreground">Status of integrated gateways</p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("settings")}
                      >
                        Edit Keys
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-medium">Stripe Payment Gateway</div>
                          <div className="text-xs text-muted-foreground">
                            Mode: <span className="uppercase font-semibold">{stripe.mode}</span> • Submission fee: ${(stripe.priceCents / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Badge variant={stripe.enabled ? "default" : "secondary"}>
                        {stripe.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium">AI Auto-Draft Generation</div>
                          <div className="text-xs text-muted-foreground">
                            Model: {settingsData.openrouterModel || "google/gemini-2.5-flash"}
                          </div>
                        </div>
                      </div>
                      <Badge variant={settingsData.aiConfigured ? "default" : "outline"}>
                        {settingsData.aiConfigured ? "Ready" : "No Key"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <FolderTree className="h-5 w-5 text-amber-500" />
                        <div>
                          <div className="text-sm font-medium">Tool Directory Taxonomy</div>
                          <div className="text-xs text-muted-foreground">{categories.length} registered categories</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("categories")}
                        className="text-xs h-7"
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TOOLS MANAGEMENT */}
          {activeTab === "tools" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter tools by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Total: {tools.length}
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    Pending: {pendingTools.length}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No tools matched the filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTools.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Link href={`/tools/${t.slug}`} className="font-semibold hover:underline flex items-center gap-1.5">
                              {t.name}
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Link>
                          </TableCell>
                          <TableCell>{t.category?.name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                t.status === "APPROVED"
                                  ? "default"
                                  : t.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {t.status === "PENDING_PAYMENT" ? "Awaiting Pay" : t.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.featured ? "⭐ Yes" : "No"}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                              {t.status !== "APPROVED" && (
                                <form action={async () => { await approveToolAction(t.id); }}>
                                  <Button size="sm" type="submit" className="h-7 text-xs">
                                    Approve
                                  </Button>
                                </form>
                              )}
                              {t.status === "APPROVED" && (
                                <form action={async () => { await rejectToolAction(t.id); }}>
                                  <Button size="sm" variant="outline" type="submit" className="h-7 text-xs">
                                    Reject
                                  </Button>
                                </form>
                              )}
                              <form action={async () => { await toggleFeaturedAction(t.id); }}>
                                <Button size="sm" variant="outline" type="submit" className="h-7 text-xs">
                                  {t.featured ? "Unfeature" : "Feature"}
                                </Button>
                              </form>
                              {isAdmin && (
                                <form action={async () => { await deleteToolAction(t.id); }}>
                                  <Button size="sm" variant="destructive" type="submit" className="h-7 text-xs">
                                    Delete
                                  </Button>
                                </form>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 3. CATEGORIES MANAGEMENT */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {isAdmin && (
                <div className="rounded-xl border bg-card p-5 space-y-3">
                  <h3 className="font-semibold text-sm">Add New Directory Category</h3>
                  <form onSubmit={handleCreateCategory} className="flex flex-wrap items-center gap-3">
                    <Input
                      placeholder="Category Name (e.g. Code Assistants)"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                      className="max-w-xs"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={categoryDesc}
                      onChange={(e) => setCategoryDesc(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button size="sm" type="submit" disabled={isSubmittingCat}>
                      <Plus className="h-4 w-4 mr-1" />
                      {isSubmittingCat ? "Creating..." : "Create Category"}
                    </Button>
                  </form>
                </div>
              )}

              <div className="rounded-xl border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>URL Slug</TableHead>
                      <TableHead>Assigned Tools</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No categories found. Create your first category above!
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">/categories/{c.slug}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {c._count?.tools ?? 0} tools
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <form action={async () => { await deleteCategoryAction(c.id); }}>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  type="submit"
                                  className="h-7 text-xs"
                                  disabled={(c._count?.tools ?? 0) > 0}
                                  title={(c._count?.tools ?? 0) > 0 ? "Cannot delete category with tools" : "Delete"}
                                >
                                  Delete
                                </Button>
                              </form>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 4. USER MANAGER */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Badge variant="outline" className="text-xs">
                  {users.length} Registered Accounts
                </Badge>
              </div>

              <div className="rounded-xl border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Joined</TableHead>
                      {isAdmin && <TableHead className="text-right">Permissions & Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found matching query.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                u.role === "ADMIN"
                                  ? "default"
                                  : u.role === "MODERATOR"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {new Date(u.createdAt).toISOString().split("T")[0]}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {(["USER", "MODERATOR", "ADMIN"] as const).map((role) => (
                                  <form
                                    key={role}
                                    action={async () => {
                                      await updateUserRoleAction(u.id, role);
                                    }}
                                  >
                                    <Button
                                      size="sm"
                                      variant={u.role === role ? "default" : "outline"}
                                      type="submit"
                                      className="h-7 px-2 text-xs"
                                    >
                                      {role === "MODERATOR" ? "Mod" : role}
                                    </Button>
                                  </form>
                                ))}
                                {u.id !== userId && (
                                  <form
                                    action={async () => {
                                      await deleteUserAction(u.id);
                                    }}
                                  >
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      type="submit"
                                      className="h-7 px-2 text-xs"
                                    >
                                      Delete
                                    </Button>
                                  </form>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 5. REVIEWS */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="rounded-xl border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No reviews yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.user?.name ?? r.user?.email}</TableCell>
                          <TableCell>{r.tool?.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">⭐ {r.rating} / 5</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate text-muted-foreground">
                            {r.comment ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {new Date(r.createdAt).toISOString().split("T")[0]}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 6. REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="rounded-xl border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reported Tool</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No reports recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-semibold">{r.tool?.name}</TableCell>
                          <TableCell>{r.reason}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "OPEN" ? "destructive" : "secondary"}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {new Date(r.createdAt).toISOString().split("T")[0]}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* 7. STRIPE & API KEYS SETTINGS */}
          {activeTab === "settings" && isAdmin && (
            <div className="max-w-4xl space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <AdminSettings data={settingsData} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
