"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthSection,
  FieldBox,
  CheckboxLine,
  SubmitButton,
} from "@/components/ui/auth-section-1";
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
    <AuthSection
      title="Create an account"
      subtitle="Bookmark tools, submit your own, join the community"
      headline={
        <>
          Explore the
          <br />
          atlas of AI
        </>
      }
      ctaHref="/tools"
      ctaLabel="Explore the AI tools"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldBox label="Name" name="name" required autoComplete="name" />
        </div>
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
          minLength={6}
          autoComplete="new-password"
        />

        <div className="space-y-4 pt-2 text-sm leading-5 text-black/30 dark:text-white/35 sm:text-[15px]">
          <CheckboxLine>
            By creating an account, you agree that submitted tools are reviewed
            by moderators before being published.
          </CheckboxLine>
        </div>

        <SubmitButton pending={pending}>
          {pending ? "Creating account..." : "Create account"}
        </SubmitButton>

        <p className="pt-4 text-center text-sm text-black/50 dark:text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-2 hover:opacity-80">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSection>
  );
}
