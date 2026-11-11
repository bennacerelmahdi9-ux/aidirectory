"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Search, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SiteHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            A
          </span>
          AIAtlas
        </Link>

        <form
          action="/tools"
          className="hidden flex-1 items-center gap-2 md:flex"
        >
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search AI tools, models, APIs..."
              className="pl-9"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/tools" className={buttonVariants({ variant: "ghost", size: "sm" })}>Tools</Link>
          <Link href="/models" className={buttonVariants({ variant: "ghost", size: "sm" })}>Models</Link>
          <Link href="/resources" className={buttonVariants({ variant: "ghost", size: "sm" })}>Resources</Link>
          <Link href="/compare" className={buttonVariants({ variant: "ghost", size: "sm" })}>Compare</Link>
        </nav>

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

          <Sheet>
            <SheetTrigger className="md:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="mt-8 flex flex-col gap-2">
                <Link href="/tools" className="text-lg font-medium">
                  Tools
                </Link>
                <Link href="/models" className="text-lg font-medium">
                  Models
                </Link>
                <Link href="/resources" className="text-lg font-medium">
                  Resources
                </Link>
                <Link href="/compare" className="text-lg font-medium">
                  Compare
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
