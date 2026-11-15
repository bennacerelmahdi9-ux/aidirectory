"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { usePathname } from "next/navigation";

export function SiteHeader({ logoId }: { logoId?: string | null }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  // Hide the global website header on the admin dashboard for a clean full-screen dashboard look
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {logoId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/media/${logoId}`} alt="AIAtlas logo" className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              A
            </span>
          )}
          AIAtlas
        </Link>

        {session?.user && (session.user.role === "ADMIN" || session.user.role === "MODERATOR") && (
          <Link
            href="/admin"
            className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            Admin Panel
          </Link>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/submit">Submit a tool</Link>
                </DropdownMenuItem>
                {session.user.role === "ADMIN" || session.user.role === "MODERATOR" ? (
                  <DropdownMenuItem>
                    <Link href="/admin">Admin</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>Sign up</Link>
            </>
          )}

        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent"
      />
    </header>
  );
}
