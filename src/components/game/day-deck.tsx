"use client";

import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Answer } from "@/game/answers";
import { say, whoFor } from "@/game/copy";
import type { Copy, Option, Round } from "@/game/deck";
import { CURRENT_DECK } from "@/game/decks";
import { plannedLength, type Pair, type PlayerInfo, type Seat, type ViewText } from "@/game/engine";
import { verdictFor, type Tone } from "@/game/verdicts";
import { Avatar } from "@/components/ui/avatar";
import { Heart } from "@/components/ui/heart";
import { Segments } from "@/components/ui/segments";
import { TONE_BG, TONE_TEXT } from "./tones";

const NAMES: Pair<string> = { host: "Sam", guest: "Jordan" };
const PLAYERS: Pair<PlayerInfo> = { host: { name: NAMES.host, avatarUrl: null }, guest: { name: NAMES.guest, avatarUrl: null } };
const SEATS = ["host", "guest"] as const;
const other = (seat: Seat): Seat => (seat === "host" ? "guest" : "host");
const s = (copy: Copy) => say(copy, "couple", { p: NAMES.guest, s: NAMES.host });

type Mark = { by: Seat; at: number; guess?: boolean };
type Body =
  | { kind: "rows"; rows: string[]; marks: Mark[] }
  | { kind: "pairs"; items: { text: string; marks: Mark[] }[] }
  | { kind: "rail"; steps: number; left: string; right: string; tracks: { owner: Seat; note: string; marks: Mark[] }[] }
  | { kind: "notes"; notes: { by: Seat; caption: string; text: string }[] };
type Beat = { round: number; time: string; scene: string; ask: string; body: Body; verdict: string; tone: Tone; land: number };
type Sample = { id: string; answers: Pair<Answer>; texts?: ViewText[]; show: (round: Round, answers: Pair<Answer>) => Body | null };

const picked = (answers: Pair<Answer>, item = 0): Mark[] => SEATS.map((by) => ({ by, at: answers[by].picks![item]! }));
const optionRows = (options: Option[], answers: Pair<Answer>): Body => ({ kind: "rows", rows: options.map((o) => s(o.label)), marks: picked(answers) });

/**
 * Real rounds from the current deck with made-up answers. The verdict comes from the game's own
 * rules, so the landing can't promise a line the game never says.
 */
const SAMPLES: Sample[] = [
  {
    id: "prelim-morning",
    answers: { host: { picks: [0] }, guest: { picks: [0] } },
    show: (r, a) => (r.format === "pick" ? optionRows(r.options, a) : null),
  },
  {
    id: "group-project",
    answers: { host: { picks: [1, 1, 1] }, guest: { picks: [1, 1, 1] } },
    show: (r, a) =>
      r.format === "likely"
        ? {
            kind: "pairs",
            // A pick of 0 names yourself and 1 names the other; `at` is the seat named, host first.
            items: r.items.map((item, i) => ({
              text: s(item.text),
              marks: SEATS.map((by) => ({ by, at: (a[by].picks![i] === 0 ? by : other(by)) === "host" ? 0 : 1 })),
            })),
          }
        : null,
  },
  {
    id: "dinner",
    answers: { host: { picks: [0] }, guest: { picks: [0] } },
    show: (r, a) => (r.format === "agree" ? optionRows(r.options, a) : null),
  },
  {
    id: "comfort-order",
    answers: { host: {}, guest: {} },
    texts: [
      { seat: "host", slot: "self", body: "Spicy noodles from Collegetown, extra chili oil", matchPct: null },
      { seat: "guest", slot: "partner", body: "Grilled cheese and tomato soup", matchPct: 21 },
    ],
    show: (r) =>
      r.format === "write"
        ? {
            kind: "notes",
            notes: [
              { by: "host", caption: NAMES.host, text: "Spicy noodles from Collegetown, extra chili oil" },
              { by: "guest", caption: `${NAMES.guest}’s guess`, text: "Grilled cheese and tomato soup" },
            ],
          }
        : null,
  },
  {
    id: "slope-night",
    answers: { host: { picks: [4], guesses: [3] }, guest: { picks: [5], guesses: [2] } },
    show: (r, a) =>
      r.format === "scale"
        ? {
            kind: "rail",
            steps: r.steps,
            left: s(r.left),
            right: s(r.right),
            tracks: SEATS.map((owner) => {
              const at = a[owner].picks![0]!;
              const guess = a[other(owner)].guesses![0]!;
              return {
                owner,
                note: `${NAMES[other(owner)]} was ${Math.abs(guess - at)} off`,
                marks: [
                  { by: owner, at },
                  { by: other(owner), at: guess, guess: true },
                ],
              };
            }),
          }
        : null,
  },
];

const BEATS: Beat[] = SAMPLES.flatMap((sample) => {
  const round = CURRENT_DECK.rounds.find((r) => r.id === sample.id);
  const body = round && sample.show(round, sample.answers);
  if (!round || !body) return [];
  const verdict = verdictFor(round, { ...sample.answers, texts: sample.texts ?? [] }, "host", whoFor("host", NAMES), 1);
  // Option rows read fastest; cards with more words on them hold the question longer.
  const land = body.kind === "rows" ? 2200 : 2600;
  // Its place in a game as played: the rounds up to it, with branch alternatives counted once.
  const step = plannedLength({ ...CURRENT_DECK, rounds: CURRENT_DECK.rounds.slice(0, CURRENT_DECK.rounds.indexOf(round) + 1) });
  return [{ round: step, time: round.scene.time, scene: s(round.scene.title), ask: s(round.prompt), body, verdict: verdict.text, tone: verdict.tone, land }];
});

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
  { x: 0, y: 0, rotate: 0, scale: 1, backgroundColor: "#ffffff" },
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
  const still = !!useReducedMotion();
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
        <Segments step={beat.round} total={ROUNDS} tone="dark" fillMs={playing ? beatMs(beat) : undefined} />
        <p className="mt-2.5 text-sm font-semibold text-white/60">
          Round {beat.round} of {ROUNDS}
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
        animate={{ opacity: front ? 1 : 0, color: flooded ? TONE_TEXT[beat.tone] : "#1a2550" }}
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
        <Locks step={step} fly={beat.body.kind === "notes" ? undefined : fly} />
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
      <FaceBody body={beat.body} step={step} wash={flooded && beat.tone !== "between"} fly={fly} />
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
              <Avatar player={PLAYERS[seat]} tone={seat === "host" ? "me" : "partner"} size={32} />
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

/** `wash` is the verdict color filling the card: answers someone landed on go white over it, the rest fade into it. */
function FaceBody({ body, step, wash, fly }: { body: Body; step: number; wash: boolean; fly?: string }) {
  const landed = step >= LANDED;
  const flooded = step === LAST_STEP;
  const fill = (marked: boolean, both = false) =>
    wash ? (marked ? "bg-white text-ink" : "bg-white/15") : landed && both ? "bg-blush" : "bg-tile";
  // Over a verdict color, a fainter fade would mix the text into it.
  const fade = (marked: boolean) => (landed && !marked ? (wash ? "opacity-80" : "opacity-60") : "");
  // Hold the tint until the faces flying in from their seats have arrived.
  const tint = landed && !flooded ? "delay-300" : "";

  switch (body.kind) {
    case "rows":
      return (
        <ul className="flex flex-col gap-2">
          {body.rows.map((label, i) => {
            const here = body.marks.filter((m) => m.at === i);
            return (
              <li key={i} className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2 transition-colors duration-300 ${tint} ${fill(here.length > 0, here.length === 2)}`}>
                <span className={`flex-1 text-[0.95rem] leading-tight lg:text-base xl:text-[1.0625rem] ${landed && here.length ? "font-bold" : "font-medium"} ${fade(here.length > 0)}`}>
                  {label}
                </span>
                {landed && <Faces marks={here} fly={fly} />}
              </li>
            );
          })}
        </ul>
      );
    case "pairs":
      return (
        <ul className="flex flex-col gap-3">
          {body.items.map((item, i) => (
            <li key={i}>
              <p className="text-sm leading-snug font-semibold opacity-75">{item.text}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {SEATS.map((named, j) => {
                  const here = item.marks.filter((m) => m.at === j);
                  return (
                    <span key={named} className={`flex min-h-11 items-center justify-between gap-2 rounded-2xl px-3.5 py-1.5 transition-colors duration-300 ${tint} ${fill(here.length > 0, here.length === 2)}`}>
                      <span className={`font-bold ${fade(here.length > 0)}`}>{NAMES[named]}</span>
                      {landed && <Faces marks={here} fly={i === 0 ? fly : undefined} />}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      );
    case "rail":
      return (
        <div className="flex flex-col gap-3">
          {body.tracks.map((track) => (
            <div key={track.owner}>
              <p className="mb-1.5 flex justify-between gap-3 text-sm font-semibold">
                <span>{NAMES[track.owner]}</span>
                <span className={`opacity-75 transition-opacity ${landed ? "" : "invisible"}`}>{track.note}</span>
              </p>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${body.steps}, 1fr)` }}>
                {Array.from({ length: body.steps }, (_, i) => (
                  <span key={i} className={`grid aspect-square place-items-center rounded-full transition-colors duration-300 ${wash ? "bg-white/15" : "bg-tile"}`}>
                    {landed && <Faces marks={track.marks.filter((m) => m.at === i)} fly={fly} />}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="flex justify-between gap-4 text-sm font-semibold opacity-75">
            <span>{body.left}</span>
            <span className="text-right">{body.right}</span>
          </p>
        </div>
      );
    case "notes":
      return (
        <div className="grid grid-cols-2 gap-2">
          {body.notes.map((note) => (
            <div key={note.by} className={`flex flex-col gap-2 rounded-2xl p-3.5 transition-colors duration-300 lg:p-4 ${fill(true)}`}>
              <span className="flex items-center gap-2 text-sm font-semibold opacity-75">
                <Avatar player={PLAYERS[note.by]} tone={note.by === "host" ? "me" : "partner"} size={24} />
                {note.caption}
              </span>
              <span className="min-h-[5.2em] text-base leading-snug font-bold lg:text-lg">
                {landed ? (
                  <motion.span className="block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    {note.text}
                  </motion.span>
                ) : (
                  <span className="flex gap-1 pt-2">
                    {[0, 1, 2].map((i) => (
                      <i key={i} className="typing-dot block size-1.5 rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      );
  }
}

/**
 * Faces on the answer they picked; a guess is the smaller face. A player's own pick flies in from their
 * seat when `fly` is set, anything else drops in. Two on one answer get a heart.
 */
function Faces({ marks, fly }: { marks: Mark[]; fly?: string }) {
  if (!marks.length) return null;
  return (
    <span className="flex flex-none items-center">
      {marks.map((m, j) => (
        <motion.span
          key={m.by}
          layoutId={fly && !m.guess ? `${fly}-${m.by}` : undefined}
          initial={fly && !m.guess ? false : { scale: 0, y: -28 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: j * 0.1, type: "spring", stiffness: 500, damping: 16, layout: { type: "spring", stiffness: 260, damping: 26 } }}
          className={`rounded-full ${j ? "-ml-1.5 ring-[3px] ring-white" : ""}`}
        >
          <Avatar player={PLAYERS[m.by]} tone={m.by === "host" ? "me" : "partner"} size={m.guess ? 22 : 28} />
        </motion.span>
      ))}
      {marks.length === 2 && !marks.some((m) => m.guess) && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ delay: 0.6, duration: 0.45 }} className="ml-1.5 text-red">
          <Heart size={20} />
        </motion.span>
      )}
    </span>
  );
}
