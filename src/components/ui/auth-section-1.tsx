"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

interface AuthSectionProps {
  /** Big title of the form card, e.g. "Create an account". */
  title: string;
  /** Subtitle under the title. */
  subtitle: string;
  /** Right panel headline (can include <br />). */
  headline: ReactNode;
  /** Real destination for the right-panel link. */
  ctaHref: string;
  ctaLabel: string;
  children: ReactNode;
}

const FADE_IN = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/**
 * Split auth section: boxed form on the left, animated shader panel with a
 * headline and a link on the right.
 */
export function AuthSection({
  title,
  subtitle,
  headline,
  ctaHref,
  ctaLabel,
  children,
}: AuthSectionProps) {
  return (
    <section className="bg-background p-3 text-foreground antialiased [font-synthesis:none]">
      <div className="grid gap-6 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left — form card */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="flex items-start rounded-2xl border border-black/20 bg-card px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:px-14 lg:py-16 xl:px-20"
        >
          <div className="mx-auto w-full max-w-[560px]">
            <motion.div variants={FADE_IN}>
              <h1 className="whitespace-nowrap text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05]">
                {title}
              </h1>
              <p className="mt-3 text-lg leading-snug text-black/60 dark:text-white/55 sm:text-xl">
                {subtitle}
              </p>
            </motion.div>

            <motion.div variants={FADE_IN} className="mt-10">
              {children}
            </motion.div>
          </div>
        </motion.div>

        {/* Right — shader panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex min-h-[420px] overflow-hidden rounded-2xl bg-black p-8 text-white sm:p-12 lg:min-h-0"
        >
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#6366F1", "#8B5CF6", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <motion.h2
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
              }}
              className="max-w-[620px] pt-0 text-4xl font-medium tracking-[-0.05em] sm:text-5xl lg:pt-16 lg:text-[56px] lg:leading-[0.98] xl:text-[64px]"
            >
              {typeof headline === "string"
                ? headline.split(" ").map((word, i) => (
                    <motion.span key={i} variants={FADE_IN} className="inline-block">
                      {word}&nbsp;
                    </motion.span>
                  ))
                : headline}
            </motion.h2>

            <motion.div
              initial="hidden"
              animate="show"
              variants={FADE_IN}
              transition={{ delay: 0.6 }}
            >
              <Link
                href={ctaHref}
                className="mb-0 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white xl:mb-24 xl:px-6 xl:text-lg"
              >
                <span className="truncate whitespace-nowrap">{ctaLabel}</span>
                <span aria-hidden className="text-xl leading-none">→</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Boxed input with the label shown inside, on the right, until editing starts. */
export function FieldBox({
  label,
  name,
  type = "text",
  required,
  minLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [value, setValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <label className="flex h-14 items-center justify-between gap-4 rounded-[10px] border border-black/25 bg-card px-5 text-lg leading-none transition-colors focus-within:border-black/60 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-white/40 xl:text-xl">
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        aria-label={label}
        value={value}
        onFocus={() => {
          if (!isEditing) setIsEditing(true);
        }}
        onChange={(event) => {
          setValue(event.target.value);
          setIsEditing(true);
        }}
        className="min-w-0 flex-1 truncate bg-transparent text-black/70 outline-none dark:text-white/80"
      />
      {!isEditing && (
        <span className="shrink-0 text-black dark:text-white">{label}</span>
      )}
    </label>
  );
}

export function CheckboxLine({ children }: { children: ReactNode }) {
  return (
    <label className="flex items-start gap-3">
      <span className="relative mt-1 size-3.5 shrink-0">
        <input
          type="checkbox"
          className="peer size-full appearance-none rounded-[2px] border border-black/25 bg-card checked:border-black checked:bg-black dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-9 flex h-12 w-full items-center justify-center rounded-[10px] border border-black/40 bg-black text-xl font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-60 dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85"
    >
      {children}
    </button>
  );
}
