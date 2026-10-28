"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactionBurst } from "@/client/useRoom";
import { REACTION_LABELS, REACTIONS, type Reaction } from "@/game/reactions";

type Floater = { id: number; emoji: Reaction; mine: boolean; dx: number; left: number };
const MAX_ON_SCREEN = 40;

/** Floating emoji layer. Returns the overlay plus a `spawn` handler to feed useRoom's bursts. */
export function useFloaters() {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const nextId = useRef(0);

  const spawn = useCallback(({ emoji, n, mine }: ReactionBurst) => {
    const fresh = Array.from({ length: n }, () => ({
      id: nextId.current++,
      emoji,
      mine,
      dx: Math.round((Math.random() - 0.5) * 80),
      left: (mine ? 60 : 8) + Math.random() * 30,
    }));
    setFloaters((prev) => [...prev, ...fresh].slice(-MAX_ON_SCREEN));
  }, []);

  const overlay = (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {floaters.map((f) => (
        <span
          key={f.id}
          className="reaction-float absolute bottom-20 text-3xl"
          style={{ left: `${f.left}%`, ["--dx" as string]: `${f.dx}px` }}
          onAnimationEnd={() => setFloaters((prev) => prev.filter((x) => x.id !== f.id))}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );

  return { spawn, overlay };
}

export function ReactionBar({ onReact }: { onReact: (emoji: Reaction) => void }) {
  return (
    <div
      role="toolbar"
      aria-label="Reactions"
      className="fixed inset-x-0 bottom-4 mx-auto flex w-fit gap-1 rounded-full border-[3px] border-pm-blue bg-white px-2 py-1 shadow-[4px_4px_0_0_var(--line)]"
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={`Send ${REACTION_LABELS[emoji]}`}
          onClick={() => onReact(emoji)}
          className="rounded-full px-2.5 py-1.5 text-2xl transition-transform active:scale-75"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
