"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactionBurst } from "@/client/useRoom";
import type { Reaction } from "@/game/reactions";

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
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {floaters.map((f) => (
        <span
          key={f.id}
          className="reaction-float absolute bottom-36 text-3xl"
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
