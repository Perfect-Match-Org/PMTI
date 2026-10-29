"use client";

import { motion } from "motion/react";

/**
 * The day as a row of segments: rounds done, the current one filling in red, the rest to come.
 * `fillMs` fills the current one steadily over that time, like a story bar; otherwise it snaps in.
 */
export function Segments({ step, total, tone = "light", fillMs }: { step: number; total: number; tone?: "light" | "dark"; fillMs?: number }) {
  return (
    <div role="img" aria-label={`Round ${step} of ${total}`} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 overflow-hidden rounded-full ${tone === "dark" ? "bg-white/15" : "bg-line"}`}>
          {i + 1 < step && <span className={`block h-full ${tone === "dark" ? "bg-white/70" : "bg-navy"}`} />}
          {i + 1 === step &&
            (fillMs ? (
              <span key={step} className="segment-fill block h-full bg-red" style={{ ["--duration" as string]: `${fillMs}ms` }} />
            ) : (
              <motion.span
                className="block h-full origin-left bg-red"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
        </span>
      ))}
    </div>
  );
}
