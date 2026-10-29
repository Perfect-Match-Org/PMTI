"use client";

import { motion } from "motion/react";

const TONES = {
  light: { track: "bg-line", done: "bg-navy", now: "bg-red" },
  dark: { track: "bg-white/15", done: "bg-white/70", now: "bg-red" },
  current: { track: "bg-current/25", done: "bg-current", now: "bg-current" },
};

/**
 * The day as a row of segments: rounds done, the current one filling, the rest to come. `fillMs`
 * fills the current one steadily over that time, like a story bar; otherwise it snaps in.
 */
export function Segments(props: { step: number; total: number; tone?: keyof typeof TONES; fillMs?: number; label?: string }) {
  const { step, total, tone = "light", fillMs, label = `Round ${step} of ${total}` } = props;
  const c = TONES[tone];
  return (
    <div role="img" aria-label={label} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 overflow-hidden rounded-full ${c.track}`}>
          {i + 1 < step && <span className={`block h-full ${c.done}`} />}
          {i + 1 === step &&
            (fillMs ? (
              <span key={step} className={`segment-fill block h-full ${c.now}`} style={{ ["--duration" as string]: `${fillMs}ms` }} />
            ) : (
              <motion.span
                className={`block h-full origin-left ${c.now}`}
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
