"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Answer } from "@/game/answers";
import type { Option, Round } from "@/game/deck";
import type { Pair, Seat, ViewText } from "@/game/engine";
import { Avatar } from "@/components/ui/avatar";
import { Heart } from "@/components/ui/heart";
import { Portal } from "@/components/ui/portal";
import { ActionBar } from "./action-bar";
import { useRoomContext } from "./room-context";

type RevealData = Pair<Answer> & { texts: ViewText[] };
type Tone = "pink" | "navy" | "red";

const FLASH_MS = 1100;
/** Content starts arriving as the flash clears. */
const AFTER_FLASH = FLASH_MS / 1000 - 0.15;
const other = (seat: Seat): Seat => (seat === "host" ? "guest" : "host");
/** Embedding similarity catches shared vibe/topic, not meaning (it can't tell "early" from "late"). */
const vibe = (pct: number | null | undefined) => (pct == null ? null : `${pct}% vibe match`);

export function Reveal({ round, reveal }: { round: Round; reveal: RevealData }) {
  const { view, seat, partnerSeat, names, t, busy, act, send } = useRoomContext();
  const reduce = useReducedMotion();
  const delay = reduce ? 0 : AFTER_FLASH;
  const pick = (s: Seat, item = 0) => reveal[s].picks?.[item];
  const label = (options: Option[], i: number | null | undefined) => (i == null ? "(skipped)" : t(options[i]!.label));
  const progress = view.progress;
  const flash = flashFor(round, reveal);

  let verdict: string | null = null;
  let sub: string | null = null;
  let body: React.ReactNode;
  switch (round.format) {
    case "pick":
    case "agree": {
      const same = pick("host") === pick("guest");
      verdict = round.format === "agree" ? (same ? "Dinner's decided." : "Nobody budged.") : same ? "Same brain." : "Two brains.";
      sub = round.format === "agree" ? `${view.tries.length + 1} ${view.tries.length ? "tries" : "try"}.` : null;
      body = (
        <PairTiles
          match={same}
          delay={delay}
          left={{ seat, caption: seat === view.seat ? "You" : names[seat], text: label(round.options, pick(seat)) }}
          right={{ seat: partnerSeat, caption: names[partnerSeat], text: label(round.options, pick(partnerSeat)) }}
        />
      );
      break;
    }
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      const hit = pick(subject) === pick(guesser);
      verdict = hit ? `${names[guesser]} has ${names[subject]} figured out.` : "Not quite. Noted.";
      body = (
        <PairTiles
          match={hit}
          delay={delay}
          left={{ seat: subject, caption: `${names[subject]} picked`, text: label(round.options, pick(subject)) }}
          right={{ seat: guesser, caption: `${names[guesser]} guessed`, text: label(round.options, pick(guesser)) }}
        />
      );
      break;
    }
    case "likely":
      body = (
        <div className="flex flex-col gap-2.5">
          {round.items.map((item, i) => {
            const named = (s: Seat) => (pick(s, i) === 0 ? s : other(s));
            const agreed = named("host") === named("guest");
            return (
              <Arrive key={i} delay={delay + i * 0.08} className={`rounded-[1.125rem] px-4 py-3.5 ${agreed ? "bg-blush" : "bg-tile"}`}>
                <p className="font-medium text-muted">{t(item.text)}</p>
                <p className="mt-1 text-lg font-bold">
                  {agreed ? `${names[named("host")]}, undisputed.` : `${names.host} says ${names[named("host")]}. ${names.guest} says ${names[named("guest")]}.`}
                </p>
              </Arrive>
            );
          })}
        </div>
      );
      break;
    case "scale": {
      const at = (s: Seat) => pick(s) ?? 0;
      const guessed = (s: Seat) => reveal[s].guesses?.[0] ?? 0;
      body = (
        <div className="flex flex-col gap-3">
          {[seat, partnerSeat].map((s, i) => (
            <Arrive key={s} delay={delay + i * 0.1} className="rounded-[1.125rem] bg-tile px-4 py-3.5">
              <p className="mb-2 font-bold">
                {s === view.seat ? "You" : names[s]}
                {guessed(other(s)) === at(s) ? <span className="text-red">, and {other(s) === view.seat ? "you" : names[other(s)]} nailed it</span> : ""}
              </p>
              <ScaleRow steps={round.steps} self={at(s)} guess={guessed(other(s))} />
            </Arrive>
          ))}
          <p className="flex justify-between gap-4 text-sm text-muted">
            <span>1 = {t(round.left)}</span>
            <span className="text-right">
              {round.steps} = {t(round.right)}
            </span>
          </p>
          <p className="text-sm text-muted">Filled dot: where each of you stands. Red ring: where the other one guessed.</p>
        </div>
      );
      break;
    }
    case "speed": {
      const same = (i: number) => pick("host", i) != null && pick("host", i) === pick("guest", i);
      const matches = round.items.filter((_, i) => same(i)).length;
      verdict = `${matches} of ${round.items.length} the same.`;
      body = (
        <div className="flex flex-col gap-2">
          {round.items.map((pair, i) => (
            <Arrive key={i} delay={delay + i * 0.06} className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${same(i) ? "bg-blush font-bold" : "bg-tile"}`}>
              {same(i) ? (
                <>
                  <span>Both: {label(pair, pick("host", i))}</span>
                  <Heart size={18} className="text-red" />
                </>
              ) : (
                <span>
                  {names.host}: {label(pair, pick("host", i))} · {names.guest}: {label(pair, pick("guest", i))}
                </span>
              )}
            </Arrive>
          ))}
        </div>
      );
      break;
    }
    case "write": {
      const textOf = (s: Seat, slot: ViewText["slot"]) => reveal.texts.find((x) => x.seat === s && x.slot === slot);
      if (round.variant === "mirror") {
        body = (
          <div className="flex flex-col gap-7">
            {[seat, partnerSeat].map((s) => {
              const g = textOf(other(s), "partner");
              return (
                <div key={s}>
                  <PairTiles
                    match={(g?.matchPct ?? 0) >= 60}
                    delay={delay}
                    left={{ seat: s, caption: `${names[s]} said`, text: textOf(s, "self")?.body ?? "" }}
                    right={{ seat: other(s), caption: `${names[other(s)]} guessed`, text: g?.body ?? "" }}
                  />
                  {vibe(g?.matchPct) && (
                    <Arrive delay={delay + 0.35} className="mt-3 text-2xl font-black text-red">
                      {vibe(g?.matchPct)}
                    </Arrive>
                  )}
                </div>
              );
            })}
          </div>
        );
      } else {
        const mine = textOf(seat, "shared");
        const theirs = textOf(partnerSeat, "shared");
        const scores = [mine?.matchPct, theirs?.matchPct].filter((p): p is number => p != null);
        const pct = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null;
        body = (
          <>
            <PairTiles
              match={(pct ?? 0) >= 60}
              delay={delay}
              left={{ seat, caption: "You", text: mine?.body ?? "" }}
              right={{ seat: partnerSeat, caption: names[partnerSeat], text: theirs?.body ?? "" }}
            />
            {vibe(pct) && (
              <Arrive delay={delay + 0.35} className="mt-3 text-2xl font-black text-red">
                {vibe(pct)}
              </Arrive>
            )}
          </>
        );
      }
      break;
    }
  }

  return (
    <div className="pt-6">
      {!reduce && <Flash text={flash.text} tone={flash.tone} />}
      <p className="text-[0.95rem] font-bold text-red">{round.scene.time}</p>
      <p className="text-[0.95rem] font-medium text-muted">{t(round.scene.title)}</p>
      {verdict && (
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, type: "spring", stiffness: 420, damping: 20 }}
          className="mt-3 origin-left text-[2.1rem] leading-[1.02] font-black tracking-[-0.02em]"
        >
          {verdict}
        </motion.h1>
      )}
      {sub && <p className="mt-1 text-lg text-muted">{sub}</p>}
      <div className="mt-6">{body}</div>
      <ActionBar
        primary={
          view.mine.ready
            ? { label: `Waiting for ${names[partnerSeat]}`, disabled: true }
            : {
                label: "Next",
                disabled: busy,
                onClick: () => act(() => send({ round: progress.phase === "reveal" ? progress.round : 0, attempt: 0, kind: "ready" })),
              }
        }
      />
    </div>
  );
}

function flashFor(round: Round, reveal: RevealData): { text: string; tone: Tone } {
  const pick = (s: Seat, i = 0) => reveal[s].picks?.[i];
  switch (round.format) {
    case "pick":
    case "agree":
      return pick("host") === pick("guest") ? { text: "Same brain!", tone: "pink" } : { text: "Two brains.", tone: "navy" };
    case "mind":
      return pick("host") === pick("guest") ? { text: "Mind read!", tone: "pink" } : { text: "Not quite.", tone: "navy" };
    case "likely": {
      const target = (s: Seat, i: number) => (pick(s, i) === 0 ? s : other(s));
      const agreed = round.items.filter((_, i) => target("host", i) === target("guest", i)).length;
      if (agreed === round.items.length) return { text: "Fully agreed.", tone: "pink" };
      if (agreed === 0) return { text: "Total denial.", tone: "red" };
      return { text: `${agreed} of ${round.items.length} agreed.`, tone: "navy" };
    }
    case "scale":
      return { text: "Where do you stand?", tone: "navy" };
    case "speed": {
      const matches = round.items.filter((_, i) => pick("host", i) != null && pick("host", i) === pick("guest", i)).length;
      return { text: `${matches} of ${round.items.length}!`, tone: matches >= 4 ? "pink" : "navy" };
    }
    case "write":
      return { text: "Vibe check…", tone: "red" };
  }
}

const TONES: Record<Tone, string> = { pink: "bg-pink text-ink", navy: "bg-navy text-white", red: "bg-red text-white" };

/** The Wrapped moment: one bold color takes the whole screen, the verdict springs in, then it clears. */
function Flash({ text, tone }: { text: string; tone: Tone }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setShow(false), FLASH_MS);
    return () => clearTimeout(id);
  }, []);
  return (
    <Portal>
      <AnimatePresence>
        {show && (
          <motion.div
            className={`fixed inset-0 z-30 grid place-items-center px-6 ${TONES[tone]}`}
            initial={{ clipPath: "circle(0% at 50% 90%)" }}
            animate={{ clipPath: "circle(150% at 50% 90%)" }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={() => setShow(false)}
          >
            <motion.p
              initial={{ scale: 0.5, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 13 }}
              className="text-center text-[clamp(3rem,15vw,5.5rem)] leading-[0.95] font-black tracking-[-0.03em]"
            >
              {text}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

function Arrive({ delay, className, children }: { delay: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 420, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type Side = { seat: Seat; caption: string; text: string };

/** The two of you, side by side: tiles slide in from opposite edges and meet; a heart joins a match. */
function PairTiles({ left, right, match, delay }: { left: Side; right: Side; match: boolean; delay: number }) {
  const { view, seat } = useRoomContext();
  const tile = (side: Side, from: number) => {
    const player = view.players[side.seat];
    return (
      <motion.div
        initial={{ opacity: 0, x: from }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
        className={`flex min-h-36 flex-col gap-2 rounded-[1.125rem] p-4 ${match ? "bg-blush" : "bg-tile"}`}
      >
        {player && <Avatar player={player} tone={side.seat === seat ? "me" : "partner"} size={36} />}
        <p className="text-sm font-semibold text-muted">{side.caption}</p>
        <p className="text-lg leading-snug font-bold">{side.text}</p>
      </motion.div>
    );
  };
  return (
    <div className="relative grid grid-cols-2 gap-2.5">
      {tile(left, -70)}
      {tile(right, 70)}
      {match && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 1] }}
          transition={{ delay: delay + 0.3, duration: 0.45 }}
          className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-red shadow-[0_0_0_5px_#fff]"
        >
          <Heart size={22} />
        </motion.span>
      )}
    </div>
  );
}

function ScaleRow({ steps, self, guess }: { steps: number; self: number; guess: number }) {
  return (
    <div className="grid grid-cols-7 gap-1" aria-hidden>
      {Array.from({ length: steps }, (_, i) => (
        <span key={i} className="relative flex h-8 items-center justify-center rounded-full bg-white">
          {i === self && <span className="size-4 rounded-full bg-navy" />}
          {i === guess && <span className="absolute size-7 rounded-full border-[3px] border-red" />}
        </span>
      ))}
    </div>
  );
}
