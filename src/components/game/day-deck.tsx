"use client";

import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Answer } from "@/game/answers";
import { say, whoFor } from "@/game/copy";
import type { Copy, Option, Round } from "@/game/deck";
import { CURRENT_DECK } from "@/game/decks";
import type { Pair, PlayerInfo, Seat, ViewText } from "@/game/engine";
import { verdictFor, type Tone } from "@/game/verdicts";
import { Avatar } from "@/components/ui/avatar";
import { Heart } from "@/components/ui/heart";

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
type Beat = { time: string; scene: string; ask: string; body: Body; verdict: string; tone: Tone };
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
    answers: { host: { picks: [4], guesses: [2] }, guest: { picks: [5], guesses: [2] } },
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
  return [{ time: round.scene.time, scene: s(round.scene.title), ask: s(round.prompt), body, verdict: verdict.text, tone: verdict.tone }];
});

const BEAT_MS = 4800;
const LAND_MS = 1000;
const VERDICT_MS = 1800;

/** Front card, then the two waiting behind it, fanned so their edges show. */
const POSES = [
  { x: 0, y: 0, rotate: 0, scale: 1, backgroundColor: "#ffffff" },
  { x: 14, y: -14, rotate: 4, scale: 0.95, backgroundColor: "#dfe4ef" },
  { x: -12, y: -26, rotate: -5, scale: 0.9, backgroundColor: "#bcc6dd" },
];
// Navy is the page color, so a navy verdict card uses the deeper navy to keep its edge.
const FLOOD: Record<Tone, string> = { pink: "bg-pink", navy: "bg-navy-deep", red: "bg-red" };
const TEXT: Record<Tone, string> = { pink: "#1a2550", navy: "#ffffff", red: "#ffffff" };
const ORIGIN = "at 86% 86%";

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
    const id = setInterval(() => setN((x) => x + 1), BEAT_MS);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <MotionConfig reducedMotion="user">
      {/* Every beat is laid out invisibly in one grid cell, so the deck is as tall as its tallest card at any width. */}
      <div ref={ref} aria-hidden className="relative mt-14 grid w-full lg:mt-0">
        {BEATS.map((beat, i) => (
          <div key={i} className="invisible [grid-area:1/1]">
            <Face beat={beat} step={2} />
          </div>
        ))}
        <AnimatePresence initial={false}>
          {[n, n + 1, n + 2].map((k) => (
            <Card key={k} beat={BEATS[k % BEATS.length]!} depth={k - n} playing={playing} still={still} />
          ))}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function Card({ beat, depth, playing, still }: { beat: Beat; depth: number; playing: boolean; still: boolean }) {
  const front = depth === 0;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!front || !playing) return;
    const timers = [setTimeout(() => setStep(1), LAND_MS), setTimeout(() => setStep(2), VERDICT_MS)];
    return () => timers.forEach(clearTimeout);
  }, [front, playing]);
  const shown = still && front ? 2 : step;
  const flooded = shown === 2;

  return (
    <motion.div
      className="absolute inset-0 origin-bottom overflow-hidden rounded-[1.75rem] lg:rounded-[2.25rem]"
      style={{ zIndex: 10 - depth }}
      initial={{ ...POSES[2], y: -70, opacity: 0 }}
      animate={{ ...POSES[depth], opacity: 1 }}
      exit={{ x: "125%", y: 40, rotate: 16, zIndex: 20, transition: { duration: 0.5, ease: [0.55, 0, 0.8, 0.4], zIndex: { duration: 0 } } }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <motion.div
        className={`absolute inset-0 ${FLOOD[beat.tone]}`}
        initial={false}
        animate={{ clipPath: `circle(${flooded ? 150 : 0}% ${ORIGIN})` }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.div
        className="relative h-full"
        initial={false}
        animate={{ opacity: front ? 1 : 0, color: flooded ? TEXT[beat.tone] : "#1a2550" }}
        transition={{ duration: 0.3, delay: front && !flooded ? 0.2 : 0.05 }}
      >
        <Face beat={beat} step={shown} />
      </motion.div>
    </motion.div>
  );
}

/** What a card shows at a step: 0 the question, 1 both answers landed, 2 the verdict. */
function Face({ beat, step }: { beat: Beat; step: number }) {
  const flooded = step === 2;
  return (
    <div className="flex h-full flex-col p-5 lg:p-8">
      <p className="text-[0.95rem] leading-snug lg:text-lg">
        <b className="font-bold">{beat.time}</b>
        <span className="block opacity-75">{beat.scene}</span>
      </p>
      <div className="grid flex-1 items-center py-4 lg:py-6">
        <motion.p
          className="text-[1.125rem] leading-snug font-bold text-balance [grid-area:1/1] lg:text-[1.5rem]"
          initial={false}
          animate={{ opacity: flooded ? 0 : 1, y: flooded ? -10 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {beat.ask}
        </motion.p>
        <motion.p
          className="origin-bottom-left text-[2.25rem] leading-[0.95] font-black tracking-[-0.03em] text-balance [grid-area:1/1] lg:text-[3rem]"
          initial={false}
          animate={flooded ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.6, opacity: 0, rotate: -4 }}
          transition={flooded ? { delay: 0.12, type: "spring", stiffness: 320, damping: 14 } : { duration: 0 }}
        >
          {beat.verdict}
        </motion.p>
      </div>
      <FaceBody body={beat.body} step={step} />
    </div>
  );
}

function FaceBody({ body, step }: { body: Body; step: number }) {
  const landed = step >= 1;
  const flooded = step === 2;
  // Answers someone landed on go white over the verdict color; the rest fade into it.
  const fill = (marked: boolean, both = false) =>
    flooded ? (marked ? "bg-white text-ink" : "bg-white/15") : landed && both ? "bg-blush" : "bg-tile";
  const fade = (marked: boolean) => (landed && !marked ? "opacity-60" : "");

  switch (body.kind) {
    case "rows":
      return (
        <ul className="flex flex-col gap-2">
          {body.rows.map((label, i) => {
            const here = body.marks.filter((m) => m.at === i);
            return (
              <li key={i} className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2 transition-colors duration-300 ${fill(here.length > 0, here.length === 2)}`}>
                <span className={`flex-1 text-[0.95rem] leading-tight lg:text-base ${landed && here.length ? "font-bold" : "font-medium"} ${fade(here.length > 0)}`}>
                  {label}
                </span>
                {landed && <Faces marks={here} />}
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
                    <span key={named} className={`flex min-h-11 items-center justify-between gap-2 rounded-2xl px-3.5 py-1.5 transition-colors duration-300 ${fill(here.length > 0, here.length === 2)}`}>
                      <span className={`font-bold ${fade(here.length > 0)}`}>{NAMES[named]}</span>
                      {landed && <Faces marks={here} />}
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
                  <span key={i} className={`grid aspect-square place-items-center rounded-full transition-colors duration-300 ${flooded ? "bg-white/15" : "bg-tile"}`}>
                    {landed && <Faces marks={track.marks.filter((m) => m.at === i)} />}
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

/** Faces dropping onto the answer they picked; a guess is the smaller face. Two on one answer get a heart. */
function Faces({ marks }: { marks: Mark[] }) {
  if (!marks.length) return null;
  return (
    <span className="flex flex-none items-center">
      {marks.map((m, j) => (
        <motion.span
          key={m.by}
          initial={{ scale: 0, y: -28 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: j * 0.1, type: "spring", stiffness: 500, damping: 16 }}
          className={`rounded-full ${j ? "-ml-1.5 ring-[3px] ring-white" : ""}`}
        >
          <Avatar player={PLAYERS[m.by]} tone={m.by === "host" ? "me" : "partner"} size={m.guess ? 22 : 28} />
        </motion.span>
      ))}
      {marks.length === 2 && !marks.some((m) => m.guess) && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ delay: 0.35, duration: 0.45 }} className="ml-1.5 text-red">
          <Heart size={20} />
        </motion.span>
      )}
    </span>
  );
}
