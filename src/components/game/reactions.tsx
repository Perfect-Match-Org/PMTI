"use client";

import { AnimatePresence, motion, useReducedMotion, type Easing } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { ReactionBurst } from "@/client/useRoom";
import type { PlayerInfo } from "@/game/engine";
import type { Reaction } from "@/game/reactions";
import { Avatar } from "@/components/ui/avatar";

type Flight = {
  times: number[];
  x: number[];
  y: number[];
  rotate: number[];
  scaleX: number[];
  scaleY: number[];
  opacity: number[];
  duration: number;
  ease?: Easing[];
};
type Floater = { id: number; emoji: Reaction; left: number; top: number; size: number; delay: number; flight: Flight };
type Combo = { emoji: Reaction; n: number };

const MAX_ON_SCREEN = 48;
export const COMBO_IDLE_MS = 1400;
const MINE_SIZE = 32;
const THEIRS_SIZE = 40;
/** Roughly the top of the action bar's reaction row. */
const BAR_TOP = 170;

const same = (s: number[]) => ({ scaleX: s, scaleY: s });

/** Each emoji moves like what it means: hearts beat, laughs roll, shock jolts, tomatoes get thrown, eyes glance. */
function flightFor(emoji: Reaction, h: number): Flight {
  const side = Math.random() < 0.5 ? -1 : 1;
  const drift = (Math.random() - 0.5) * 60;
  switch (emoji) {
    case "❤️":
      return {
        times: [0, 0.15, 0.4, 0.7, 1],
        x: [0, 14 * side, -10 * side, 12 * side, drift],
        y: [0, -0.14 * h, -0.28 * h, -0.42 * h, -0.55 * h],
        rotate: [0, -8 * side, 6 * side, -4 * side, 0],
        ...same([0.3, 1.5, 1.1, 1.3, 1]),
        opacity: [0, 1, 1, 1, 0],
        duration: 1.9,
      };
    case "😂":
      return {
        times: [0, 0.2, 0.4, 0.7, 1],
        x: [0, 18 * side, 28 * side, 40 * side, 40 * side + drift],
        y: [0, -0.2 * h, -0.27 * h, -0.4 * h, -0.5 * h],
        rotate: [0, -24, 22, -18, 12],
        ...same([0.3, 1.45, 1.2, 1.35, 1.1]),
        opacity: [0, 1, 1, 1, 0],
        duration: 1.6,
      };
    case "😱":
      return {
        times: [0, 0.16, 0.32, 0.46, 0.6, 1],
        x: [0, 0, -7, 7, -5, drift],
        y: [0, -0.38 * h, -0.36 * h, -0.37 * h, -0.36 * h, -0.46 * h],
        rotate: [0, 0, -7, 7, -4, 0],
        ...same([0.3, 1.9, 1.6, 1.75, 1.6, 1.3]),
        opacity: [0, 1, 1, 1, 1, 0],
        duration: 1.5,
        ease: ["backOut", "linear", "linear", "linear", "easeIn"],
      };
    case "🍅": {
      const dx = side * (50 + Math.random() * 110);
      return {
        times: [0, 0.45, 0.7, 0.76, 1],
        x: [0, dx * 0.55, dx, dx, dx],
        y: [0, -0.5 * h, -0.34 * h, -0.34 * h, -0.34 * h],
        rotate: [0, side * 220, side * 360, side * 360, side * 360],
        scaleX: [0.4, 1.2, 1.3, 2.1, 2.2],
        scaleY: [0.4, 1.2, 1.3, 0.5, 0.45],
        opacity: [0, 1, 1, 1, 0],
        duration: 1.5,
        ease: ["circOut", "circIn", "backOut", "easeIn"],
      };
    }
    case "👀":
      return {
        times: [0, 0.2, 0.38, 0.55, 0.75, 1],
        x: [0, 6 * side, 6 * side, -12 * side, -12 * side, drift],
        y: [0, -0.2 * h, -0.22 * h, -0.3 * h, -0.32 * h, -0.46 * h],
        rotate: [0, 0, 0, 0, 0, 0],
        scaleX: [0.3, 1.3, -1.3, -1.3, 1.3, 1.1],
        scaleY: [0.3, 1.3, 1.3, 1.3, 1.3, 1.1],
        opacity: [0, 1, 1, 1, 1, 0],
        duration: 2,
      };
  }
}

/** A tomato from your partner is thrown at you: it grows as it comes closer, then splats on the glass. */
function incomingTomato(h: number): Flight {
  const side = Math.random() < 0.5 ? -1 : 1;
  const dx = (Math.random() - 0.5) * 80;
  return {
    times: [0, 0.3, 0.55, 0.62, 1],
    x: [0, dx * 0.4, dx, dx, dx],
    y: [0, 0.12 * h, 0.26 * h, 0.26 * h, 0.26 * h],
    rotate: [0, side * 160, side * 360, side * 360, side * 360],
    scaleX: [0.25, 0.9, 2.4, 3.4, 3.6],
    scaleY: [0.25, 0.9, 2.4, 1.5, 1.4],
    opacity: [0, 1, 1, 1, 0],
    duration: 1.4,
    ease: ["easeIn", "easeIn", "backOut", "easeIn"],
  };
}

const STILL: Flight = { times: [0, 0.2, 1], x: [0, 0, 0], y: [0, 0, 0], rotate: [0, 0, 0], ...same([1, 1, 1]), opacity: [0, 1, 0], duration: 1.2 };

function launchPoint(emoji: Reaction) {
  const rect = document.querySelector(`[data-reaction="${emoji}"]`)?.getBoundingClientRect();
  return rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight - BAR_TOP };
}

/**
 * The emoji layer. Yours launch from the button you tapped; your partner's stream in across the
 * screen (staggered over the batch window, so a burst of 12 reads as a stream, not a clump) with
 * a counter showing who is sending them.
 */
export function useReactionLayer() {
  const reduce = useReducedMotion();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [combo, setCombo] = useState<Combo | null>(null);
  const nextId = useRef(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const spawn = useCallback(
    ({ emoji, n, mine }: ReactionBurst) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const fresh = Array.from({ length: n }, (_, i): Floater => {
        const base = { id: nextId.current++, emoji, delay: mine ? 0 : (i * 0.25) / n };
        if (!mine && emoji === "🍅") {
          return { ...base, left: w * (0.25 + Math.random() * 0.5), top: h * 0.18, size: THEIRS_SIZE, flight: reduce ? STILL : incomingTomato(h) };
        }
        const from = mine ? launchPoint(emoji) : { x: w / 2 + (Math.random() - 0.5) * Math.min(w, 448) * 0.8, y: h - BAR_TOP };
        return { ...base, left: from.x, top: from.y, size: mine ? MINE_SIZE : THEIRS_SIZE, flight: reduce ? STILL : flightFor(emoji, h) };
      });
      setFloaters((prev) => [...prev, ...fresh].slice(-MAX_ON_SCREEN));
      if (!mine) {
        setCombo((prev) => (prev?.emoji === emoji ? { emoji, n: prev.n + n } : { emoji, n }));
        clearTimeout(comboTimer.current);
        comboTimer.current = setTimeout(() => setCombo(null), COMBO_IDLE_MS);
      }
    },
    [reduce]
  );

  const overlay = (partner: PlayerInfo | null | undefined) => (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {floaters.map(({ id, emoji, left, top, size, delay, flight }) => (
        <motion.span
          key={id}
          data-floater={emoji}
          className="absolute text-center leading-none select-none"
          style={{ left, top, width: size, height: size, fontSize: size, marginLeft: -size / 2, marginTop: -size / 2 }}
          initial={{ opacity: 0 }}
          animate={{ x: flight.x, y: flight.y, rotate: flight.rotate, scaleX: flight.scaleX, scaleY: flight.scaleY, opacity: flight.opacity }}
          transition={{ duration: flight.duration, times: flight.times, ease: flight.ease ?? "easeOut", delay }}
          onAnimationComplete={() => setFloaters((prev) => prev.filter((f) => f.id !== id))}
        >
          {emoji}
        </motion.span>
      ))}
      <AnimatePresence>
        {combo && partner && (
          <div key="combo" className="fixed inset-x-0 bottom-40">
            <div className="mx-auto max-w-md px-5">
              <motion.div
                initial={{ x: -32, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                className="inline-flex items-center gap-2 rounded-full bg-ink py-1.5 pr-4 pl-1.5 text-white"
              >
                <Avatar player={partner} tone="partner" size={30} />
                <span className="text-2xl leading-none">{combo.emoji}</span>
                {combo.n > 1 && (
                  <motion.b
                    key={combo.n}
                    initial={{ scale: 1.7 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 14 }}
                    className="text-lg font-black tabular-nums"
                  >
                    ×{combo.n}
                  </motion.b>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return { spawn, overlay };
}
