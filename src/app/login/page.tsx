"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthSection,
  FieldBox,
  SubmitButton,
} from "@/components/ui/auth-section-1";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    setPending(false);
    if (res?.error) toast.error("Invalid credentials");
    else {
      toast.success("Signed in");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <AuthSection
      title="Sign in"
      subtitle="Welcome back to the atlas"
      headline={
        <>
          Think fast,
          <br />
          Build faster
        </>
      }
      ctaHref="/tools"
      ctaLabel="Explore the AI tools"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FieldBox
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <FieldBox
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />

        <SubmitButton pending={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </SubmitButton>

        <p className="pt-4 text-center text-sm text-black/50 dark:text-white/50">
          No account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-2 hover:opacity-80">
            Sign up
          </Link>
        </p>
      </form>
    </AuthSection>
  );
}
