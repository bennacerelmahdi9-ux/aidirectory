"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GridPulse } from "@/components/ui/grid-pulse";

interface AuthSplitProps {
  title: string;
  description: string;
  highlights: string[];
  children: React.ReactNode;
  className?: string;
}

/** A halo in the panel colour, so lit cells never crowd the letters. */
const guard =
  "[text-shadow:0_0_6px_var(--color-primary),0_0_14px_var(--color-primary),0_0_30px_var(--color-primary)]";

const FADE_IN = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/**
 * Split-screen auth layout: animated brand panel on the left, the form on
 * the right. The left panel collapses away on small screens.
 */
export function AuthSplit({ title, description, highlights, children, className }: AuthSplitProps) {
  return (
    <div className={cn("mx-auto grid w-full max-w-6xl lg:grid-cols-2", className)}>
      {/* Left — animated brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center rounded-2xl border border-primary/20 bg-primary p-10 text-primary-foreground">
        <GridPulse />
        <div className="relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={FADE_IN}
            className="flex items-center gap-2 font-bold text-lg"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-background/15 ring-1 ring-background/25 backdrop-blur">
              A
            </span>
            AIAtlas
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="mt-8 text-4xl font-bold tracking-tighter"
          >
            {title.split(" ").map((word, i) => (
              <motion.span key={i} variants={FADE_IN} className="inline-block">
                {word}&nbsp;
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            data-grid-avoid
            initial="hidden"
            animate="show"
            variants={FADE_IN}
            transition={{ delay: 0.35 }}
            className={`mt-4 max-w-md text-muted-foreground/90 ${guard}`}
          >
            {description}
          </motion.p>

          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } }}
            className="mt-8 space-y-3"
          >
            {highlights.map((item) => (
              <motion.li
                key={item}
                data-grid-avoid
                variants={FADE_IN}
                className="flex items-center gap-3 text-sm"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/15 ring-1 ring-background/25">
                  <Check className="h-3 w-3" />
                </span>
                <span className={guard}>{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>

      {/* Right — form */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={FADE_IN}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-center px-4 py-12 sm:px-8"
      >
        <div className="w-full max-w-md">{children}</div>
      </motion.div>
    </div>
  );
}

/** Link styled for use under auth forms. */
export function AuthSwitchLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
