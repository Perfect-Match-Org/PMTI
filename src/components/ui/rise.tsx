"use client";

import { motion } from "motion/react";

/** Content rising into place on a spring, `delay` seconds in: the one entrance used across the game and landing. */
export function Rise({ as = "p", delay = 0, className, children }: { as?: "p" | "div"; delay?: number; className?: string; children: React.ReactNode }) {
  const Tag = as === "div" ? motion.div : motion.p;
  return (
    <Tag initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay, type: "spring", stiffness: 380, damping: 28 }} className={className}>
      {children}
    </Tag>
  );
}
