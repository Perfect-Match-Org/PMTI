"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { say } from "@/game/copy";
import { CURRENT_DECK } from "@/game/decks";
import type { Tone } from "@/game/verdicts";
import { TONES } from "./tones";

/** Sample verdicts the game really says, on the rounds they come from. Illustration, not rules. */
const BEATS: { round: string; verdict: string; tone: Tone }[] = [
  { round: "prelim-morning", verdict: "Same brain.", tone: "pink" },
  { round: "group-project", verdict: "Total denial.", tone: "red" },
  { round: "snow-speed", verdict: "3 of 5 the same.", tone: "navy" },
  { round: "dinner", verdict: "Agreed in one try. Suspicious.", tone: "pink" },
  { round: "comfort-order", verdict: "Different planets.", tone: "red" },
  { round: "slope-night", verdict: "Off by 2.", tone: "navy" },
];
const BEAT_MS = 2600;

/**
 * The landing's picture of the game: the day's moments and their verdicts, each bursting in the
 * way the real reveal does.
 */
export function VerdictReel() {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setN((x) => x + 1), BEAT_MS);
    return () => clearInterval(id);
  }, [reduce]);

  // The previous beat stays underneath until the new one has covered it.
  const layers = n === 0 ? [0] : [n - 1, n];
  return (
    <div aria-hidden className="relative h-36 overflow-hidden rounded-[1.75rem] lg:aspect-[4/5] lg:h-auto lg:rounded-[2.25rem]">
      {layers.map((k) => (
        <Beat key={k} index={k} enter={k > 0} />
      ))}
    </div>
  );
}

function Beat({ index, enter }: { index: number; enter: boolean }) {
  const beat = BEATS[index % BEATS.length]!;
  const round = CURRENT_DECK.rounds.find((r) => r.id === beat.round);
  return (
    <motion.div
      className={`absolute inset-0 flex flex-col justify-between p-5 lg:p-9 ${TONES[beat.tone]}`}
      initial={enter ? { clipPath: "circle(0% at 88% 88%)" } : false}
      animate={{ clipPath: "circle(150% at 88% 88%)" }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {round && (
        <motion.p
          initial={enter ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-[0.95rem] leading-snug lg:text-lg"
        >
          <b className="font-bold">{round.scene.time}</b>
          <span className="block opacity-80">{say(round.scene.title, "couple")}</span>
        </motion.p>
      )}
      <motion.p
        initial={enter ? { scale: 0.6, opacity: 0, rotate: -4 } : false}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 14 }}
        className="origin-bottom-left text-[2.25rem] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:text-[4.25rem]"
      >
        {beat.verdict}
      </motion.p>
    </motion.div>
  );
}
