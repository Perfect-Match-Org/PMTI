"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { REACTION_LABELS, REACTIONS, type Reaction } from "@/game/reactions";
import { Portal } from "@/components/ui/portal";
import { COMBO_IDLE_MS } from "./reactions";
import { useRoomContext } from "./room-context";

type Action = { label: string; onClick?: () => void; disabled?: boolean };

/** A held or doubled Enter shouldn't carry over onto the next screen's button the moment it appears. */
const ENTER_GRACE_MS = 1000;

/**
 * The one place the main action lives, pinned to the bottom of every screen so your thumb never
 * has to look for it. Screens pass their action; the bar looks and sits the same everywhere. On a
 * wide screen it becomes a footer: reactions on the left, the action bottom-right.
 */
export function ActionBar({ primary, secondary, reactions = true }: { primary: Action; secondary?: Action; reactions?: boolean }) {
  useEnterKey(primary);
  return (
    <Portal>
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur-sm md:border-t-2 md:border-line">
        <div className="frame flex flex-col gap-3 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pt-3 lg:flex-row lg:items-center lg:py-5">
          {reactions && (
            <div role="toolbar" aria-label="Reactions" className="grid grid-cols-5 place-items-center lg:flex lg:gap-3">
              {REACTIONS.map((emoji) => (
                <ReactionButton key={emoji} emoji={emoji} />
              ))}
            </div>
          )}
          <div className="flex gap-3 lg:ml-auto">
            {secondary && (
              <button type="button" onClick={secondary.onClick} disabled={secondary.disabled} className="btn btn-secondary flex-none">
                {secondary.label}
              </button>
            )}
            <button
              type="button"
              data-primary-action
              onClick={primary.onClick}
              disabled={primary.disabled}
              className="btn btn-primary flex-1 lg:min-w-60 lg:flex-none"
            >
              {primary.label}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/**
 * Enter presses the primary action, as in a form. Focused links, buttons and fields keep their own
 * Enter, except option tiles: like native radios, Enter on a picked option submits.
 */
function useEnterKey(primary: Action) {
  const latest = useRef(primary);
  useEffect(() => {
    latest.current = primary;
  });
  useEffect(() => {
    const shownAt = performance.now();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.isComposing || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (performance.now() - shownAt < ENTER_GRACE_MS) return;
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused.closest('a[href], button:not([role="radio"]), textarea, [contenteditable="true"]')) return;
      const { onClick, disabled } = latest.current;
      if (!onClick || disabled) return;
      e.preventDefault();
      onClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
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
      // A mouse click shouldn't park focus here, or the next Enter would send another emoji instead of the action.
      onMouseDown={(e) => e.preventDefault()}
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
