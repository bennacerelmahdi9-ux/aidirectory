"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  ctaHref: string;
  /** Marquee tiles rendered along the bottom edge, duplicated automatically for a seamless loop. */
  items: React.ReactNode[];
  className?: string;
}

// Animation variants for the text content
const FADE_IN_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

/**
 * Animated marquee hero: pill tagline, staggered word-by-word title,
 * description, animated call to action, and an endlessly scrolling strip
 * of tiles along the bottom edge that fades in and out of view.
 */
export function AnimatedMarqueeHero({
  tagline,
  title,
  description,
  ctaText,
  ctaHref,
  items,
  className,
}: AnimatedMarqueeHeroProps) {
  const reducedMotion = useReducedMotion();

  // Duplicate items for a seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4 py-24",
        className,
      )}
    >
      <div className="z-10 flex flex-col items-center">
        {/* Tagline */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
        >
          {tagline}
        </motion.div>

        {/* Main Title */}
        <motion.h2
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground"
        >
          {typeof title === "string" ? (
            title.split(" ").map((word, i) => (
              <motion.span key={i} variants={FADE_IN_ANIMATION_VARIANTS} className="inline-block">
                {word}&nbsp;
              </motion.span>
            ))
          ) : (
            title
          )}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          {description}
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.6 }}
          whileHover={reducedMotion ? undefined : { scale: 1.05 }}
          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
        >
          <Link
            href={ctaHref}
            className="mt-8 inline-flex items-center rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-opacity-75"
          >
            {ctaText}
          </Link>
        </motion.div>
      </div>

      {/* Animated Tile Marquee */}
      {!reducedMotion && items.length > 0 && (
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-40 md:h-56 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_75%,transparent)]">
          <motion.div
            className="flex h-full w-max items-center gap-4 pr-4"
            animate={{
              x: ["-50%", "0%"],
              transition: {
                ease: "linear",
                duration: 90,
                repeat: Infinity,
              },
            }}
          >
            {duplicatedItems.map((item, index) => (
              <div
                key={index}
                className="h-32 md:h-44 flex-shrink-0"
                style={{ rotate: `${index % 2 === 0 ? -2 : 2.5}deg` }}
              >
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}
