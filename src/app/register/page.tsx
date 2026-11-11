"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplit, AuthSwitchLink } from "@/components/auth-split";
import { registerUser } from "@/app/actions";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const res = await registerUser(fd);
    setPending(false);
    if (!res.ok) toast.error(res.error ?? "Failed");
    else {
      toast.success("Account created. Please sign in.");
      router.push("/login");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-16">
      <AuthSplit
        title="Join AIAtlas"
        description="Create a free account to bookmark tools, submit your own, and help the community grow the atlas."
        highlights={[
          "Bookmark and track your favourite AI tools",
          "Submit tools, models and developer resources",
          "Community-driven, open source and free",
        ]}
      >
        <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
        <p className="mt-1 text-sm text-muted-foreground">It only takes a few seconds.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} className="h-11" />
            <p className="text-xs text-muted-foreground">At least 6 characters.</p>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <AuthSwitchLink href="/login">Sign in</AuthSwitchLink>
          </p>
        </form>
      </AuthSplit>
    </div>
  );
}
