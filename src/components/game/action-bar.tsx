"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { REACTION_LABELS, REACTIONS, type Reaction } from "@/game/reactions";
import { Portal } from "@/components/ui/portal";
import { COMBO_IDLE_MS } from "./reactions";
import { useRoomContext } from "./room-context";

type Action = { label: string; onClick?: () => void; disabled?: boolean };

/**
 * The one place the main action lives, pinned to the bottom of every screen so your thumb never
 * has to look for it. Screens pass their action; the bar looks and sits the same everywhere.
 */
export function ActionBar({ primary, secondary, reactions = true }: { primary: Action; secondary?: Action; reactions?: boolean }) {
  return (
    <Portal>
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {reactions && (
            <div role="toolbar" aria-label="Reactions" className="grid grid-cols-5 place-items-center">
              {REACTIONS.map((emoji) => (
                <ReactionButton key={emoji} emoji={emoji} />
              ))}
            </div>
          )}
          <div className="flex gap-3">
            {secondary && (
              <button type="button" onClick={secondary.onClick} disabled={secondary.disabled} className="btn btn-secondary flex-none">
                {secondary.label}
              </button>
            )}
            <button type="button" onClick={primary.onClick} disabled={primary.disabled} className="btn btn-primary flex-1">
              {primary.label}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const RING: Record<Reaction, string> = {
  "❤️": "var(--color-red)",
  "😂": "var(--color-pink-deep)",
  "😱": "var(--color-navy)",
  "🍅": "var(--color-red)",
  "👀": "var(--color-muted)",
};

/** Every tap squashes the emoji, sends out a ring, and counts the streak while you keep mashing. */
function ReactionButton({ emoji }: { emoji: Reaction }) {
  const { react } = useRoomContext();
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const [streak, setStreak] = useState(0);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tap = () => {
    react(emoji);
    navigator.vibrate?.(8);
    setStreak((n) => n + 1);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setStreak(0), COMBO_IDLE_MS);
    if (!reduce) animate(scope.current, { scale: [1, 1.55, 0.88, 1.1, 1], rotate: [0, -16, 9, -4, 0] }, { duration: 0.45, ease: "easeOut" });
  };

  return (
    <button
      type="button"
      data-reaction={emoji}
      aria-label={`Send ${REACTION_LABELS[emoji]}`}
      onClick={tap}
      className="relative grid size-11 place-items-center rounded-full"
    >
      {streak > 0 && !reduce && (
        <motion.span
          key={streak}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-[3px]"
          style={{ borderColor: RING[emoji] }}
          initial={{ scale: 0.5, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}
      <span ref={scope} className="block text-[1.6rem] leading-none">
        {emoji}
      </span>
      <AnimatePresence>
        {streak > 1 && (
          <motion.span
            key="streak"
            aria-hidden
            className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-sm font-black tabular-nums text-red"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <motion.span
              key={streak}
              className="block"
              initial={{ scale: 1.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 700, damping: 15 }}
            >
              ×{streak}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
