"use client";

import { AnimatePresence, motion } from "motion/react";
import { Heart } from "@/components/ui/heart";

type Props = {
  label: string;
  options: string[];
  value: number | null;
  onChange: (index: number) => void;
  disabled?: boolean;
  layout?: "stack" | "pair" | "scale";
};

const GRID = { stack: "grid-cols-1 gap-2.5", pair: "grid-cols-2 gap-2", scale: "grid-cols-7 gap-1.5" };

export function Choices({ label, options, value, onChange, disabled, layout = "stack" }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid ${GRID[layout]}`}>
      {options.map((option, i) => {
        const checked = value === i;
        return (
          <motion.button
            key={i}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(i)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: checked ? [1, 1.025, 1] : 1 }}
            transition={{
              delay: i * 0.035,
              type: "spring",
              stiffness: 500,
              damping: 30,
              // Springs only take two keyframes; the selection pop uses a short tween instead.
              scale: { type: "tween", duration: 0.25, ease: "easeOut", delay: 0 },
            }}
            className={`tile ${layout === "scale" ? "tile-dot" : ""} ${layout === "pair" ? "min-h-[4.25rem] text-center text-balance" : ""} ${layout === "stack" ? "flex items-center justify-between gap-3" : ""}`}
          >
            <span>{option}</span>
            {layout === "stack" && (
              <AnimatePresence>
                {checked && (
                  <motion.span
                    key="heart"
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 700, damping: 14 }}
                    className="flex-none text-red"
                  >
                    <Heart size={22} />
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/** End labels for a scale, aligned with the first and last dot. */
export function ScaleEnds({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between gap-6 text-sm font-semibold text-muted">
      <span className="text-balance">{left}</span>
      <span className="text-right text-balance">{right}</span>
    </div>
  );
}
