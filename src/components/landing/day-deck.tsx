"use client";

import { AnimatePresence, MotionConfig, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/brand";
import { usePrefersReducedMotion } from "@/client/motion";
import { CURRENT_DECK } from "@/game/decks";
import { plannedLength, SEATS } from "@/game/engine";
import type { Tone } from "@/game/verdicts";
import { RevealBody } from "@/components/game/reveal-body";
import { TONE_BG, TONE_TEXT } from "@/components/game/tones";
import { Avatar } from "@/components/ui/avatar";
import { Segments } from "@/components/ui/segments";
import { BEATS, SAMPLE_NAMES, SAMPLE_PLAYERS, sampleSay, sampleWho, type Beat } from "./sample-day";

/** A card's steps: 0 the question, 1–2 each player locked in (picks still hidden), 3 both answers landed, 4 the verdict. */
const LANDED = 3;
const LAST_STEP = 4;
const LOCK_MS = [1200, 1700];
const ROUNDS = plannedLength(CURRENT_DECK);
const VERDICT_AFTER_MS = 700;
const HOLD_MS = 2000;
const beatMs = (beat: Beat) => beat.land + VERDICT_AFTER_MS + HOLD_MS;

/** Front card, then the two waiting behind it, fanned so their edges show. */
const POSES = [
  { x: 0, y: 0, rotate: 0, scale: 1, backgroundColor: BRAND.white },
  { x: 9, y: -14, rotate: 3, scale: 0.95, backgroundColor: "#dfe4ef" },
  { x: -8, y: -26, rotate: -4, scale: 0.9, backgroundColor: "#bcc6dd" },
];
const ORIGIN = "at 86% 86%";
// A match is swiped right and a miss left; an in-between just sinks. The left swipe is short and fades, so it never crosses the headline.
const EXIT: Record<Tone, { x: number | string; y: number; rotate: number; scale?: number; opacity?: number }> = {
  match: { x: "125%", y: 40, rotate: 16 },
  miss: { x: "-45%", y: 30, rotate: -14, opacity: 0 },
  between: { x: 0, y: 70, rotate: 2, scale: 0.88, opacity: 0 },
};

/**
 * The landing's picture of the game: a Cornell day as a deck of rounds. The front card plays a
 * round (both answers land at once, then the verdict floods the card) and flicks away for the next.
 */
export function DayDeck() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const still = usePrefersReducedMotion();
  const playing = inView && !still;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setN((x) => x + 1), beatMs(BEATS[n % BEATS.length]!));
    return () => clearTimeout(id);
  }, [playing, n]);

  const beat = BEATS[n % BEATS.length]!;
  return (
    <MotionConfig reducedMotion="user">
      {/* Every beat is laid out invisibly in one grid cell, so the deck is as tall as its tallest card at any width. */}
      <div ref={ref} aria-hidden className="relative grid w-full">
        {BEATS.map((beat, i) => (
          <div key={i} className="invisible [grid-area:1/1]">
            <Face beat={beat} step={LAST_STEP} />
          </div>
        ))}
        <AnimatePresence initial={false}>
          {[n, n + 1, n + 2].map((k) => (
            <Card key={k} id={k} beat={BEATS[k % BEATS.length]!} depth={k - n} playing={playing} still={still} />
          ))}
        </AnimatePresence>
      </div>
      <div aria-hidden className="mt-6 lg:mt-8">
        <Segments step={beat.step} total={ROUNDS} tone="dark" fillMs={playing ? beatMs(beat) : undefined} />
        <p className="mt-2.5 text-sm font-semibold text-white/60">
          Round {beat.step} of {ROUNDS}
        </p>
      </div>
    </MotionConfig>
  );
}

function Card({ id, beat, depth, playing, still }: { id: number; beat: Beat; depth: number; playing: boolean; still: boolean }) {
  const front = depth === 0;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!front || !playing) return;
    const at = [...LOCK_MS, beat.land, beat.land + VERDICT_AFTER_MS];
    // Only ever forward, so scrolling away and back mid-beat doesn't replay steps already shown.
    const timers = at.map((ms, i) => setTimeout(() => setStep((s) => Math.max(s, i + 1)), ms));
    return () => timers.forEach(clearTimeout);
  }, [front, playing, beat.land]);
  const shown = still && front ? LAST_STEP : step;
  const flooded = shown === LAST_STEP;

  return (
    <motion.div
      className="absolute inset-0 origin-bottom overflow-hidden rounded-[1.75rem] lg:rounded-[2.25rem]"
      style={{ zIndex: 10 - depth }}
      initial={{ ...POSES[2], y: -70, opacity: 0 }}
      animate={{ ...POSES[depth], opacity: 1 }}
      exit={{ ...EXIT[beat.tone], zIndex: 20, transition: { duration: 0.5, ease: [0.55, 0, 0.8, 0.4], zIndex: { duration: 0 } } }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <motion.div
        className={`absolute inset-0 ${TONE_BG[beat.tone]}`}
        initial={false}
        animate={{ clipPath: `circle(${flooded ? 150 : 0}% ${ORIGIN})` }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.div
        className="relative h-full"
        initial={false}
        animate={{ opacity: front ? 1 : 0, color: flooded ? TONE_TEXT[beat.tone] : BRAND.ink }}
        transition={{ duration: 0.3, delay: front && !flooded ? 0.2 : 0.05 }}
      >
        <Face beat={beat} step={shown} fly={`card-${id}`} />
      </motion.div>
    </motion.div>
  );
}

/** `fly` names a live card's avatars so each one flies from its seat to its answer; the invisible sizers leave it out. */
function Face({ beat, step, fly }: { beat: Beat; step: number; fly?: string }) {
  const flooded = step === LAST_STEP;
  return (
    <div className="flex h-full flex-col p-5 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.95rem] leading-snug lg:text-lg">
          <b className="font-bold">{beat.time}</b>
          <span className="block opacity-75">{beat.scene}</span>
        </p>
        <Locks step={step} fly={beat.round.format === "write" ? undefined : fly} />
      </div>
      <div className="grid flex-1 items-center py-4 lg:py-6">
        <motion.p
          className="text-[1.125rem] leading-snug font-bold text-balance [grid-area:1/1] lg:text-[1.5rem] xl:text-[1.625rem]"
          initial={false}
          animate={{ opacity: flooded ? 0 : 1, y: flooded ? -10 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {beat.ask}
        </motion.p>
        <motion.p
          className="origin-bottom-left text-[2.25rem] leading-[0.95] font-black tracking-[-0.03em] text-balance [grid-area:1/1] lg:text-[3rem] xl:text-[3.5rem]"
          initial={false}
          animate={flooded ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.6, opacity: 0, rotate: -4 }}
          transition={flooded ? { delay: 0.12, type: "spring", stiffness: 320, damping: 14 } : { duration: 0 }}
        >
          {beat.verdict}
        </motion.p>
      </div>
      <RevealBody
        round={beat.round}
        reveal={beat.reveal}
        viewer={null}
        players={SAMPLE_PLAYERS}
        names={SAMPLE_NAMES}
        who={sampleWho}
        t={sampleSay}
        compact
        landed={step >= LANDED}
        wash={flooded && beat.tone !== "between"}
        fly={fly}
      />
    </div>
  );
}

/**
 * Two empty seats that fill as each player locks in a pick nobody can see yet. When the answers land,
 * each avatar leaves its seat for the answer it picked (or, with nowhere to fly, fades with the seats).
 */
function Locks({ step, fly }: { step: number; fly?: string }) {
  const landed = step >= LANDED;
  return (
    <motion.span className="flex flex-none gap-1.5 pt-0.5" initial={false} animate={{ opacity: landed ? 0 : 1 }} transition={{ duration: 0.2 }}>
      {SEATS.map((seat, i) => (
        <span key={seat} className="relative size-8 rounded-full border-2 border-dashed border-current/25">
          {step > i && !(landed && fly) && (
            <motion.span
              layoutId={fly && `${fly}-${seat}`}
              className="absolute -inset-0.5 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 16 }}
            >
              <Avatar player={SAMPLE_PLAYERS[seat]} tone={seat === "host" ? "me" : "partner"} size={32} />
              <span className="absolute -top-1 -right-1 grid size-3.5 place-items-center rounded-full bg-ink text-white ring-2 ring-white">
                <svg viewBox="0 0 12 12" className="size-2" aria-hidden>
                  <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1.2" fill="currentColor" />
                </svg>
              </span>
            </motion.span>
          )}
        </span>
      ))}
    </motion.span>
  );
}
