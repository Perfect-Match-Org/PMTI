"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { usePrefersReducedMotion } from "@/client/motion";
import { useEffect, useLayoutEffect, useState } from "react";
import type { Answer } from "@/game/answers";
import { promptFor, whoFor } from "@/game/copy";
import type { Option, Round } from "@/game/deck";
import { other, type Pair, type Seat, type ViewText } from "@/game/engine";
import { averagePct, likelyItem, verdictFor, vibeWord, type Tone } from "@/game/verdicts";
import { Avatar } from "@/components/ui/avatar";
import { Heart } from "@/components/ui/heart";
import { Portal } from "@/components/ui/portal";
import { ActionBar } from "./action-bar";
import { ScaleEnds } from "./choices";
import { useRoomContext } from "./room-context";
import { Stage } from "./stage";
import { TONE_BG, TONE_TEXT } from "./tones";

type RevealData = Pair<Answer> & { texts: ViewText[] };

const FLASH_MS = 1100;
/** Content starts arriving as the flash clears. */
const AFTER_FLASH = FLASH_MS / 1000 - 0.15;

export function Reveal({ round, reveal }: { round: Round; reveal: RevealData }) {
  const { view, seat, partnerSeat, names, t, busy, act, send } = useRoomContext();
  const reduce = usePrefersReducedMotion();
  const delay = reduce ? 0 : AFTER_FLASH;
  const who = whoFor(seat, names);
  const pick = (s: Seat, item = 0) => reveal[s].picks?.[item];
  const progress = view.progress;
  const verdict = verdictFor(round, reveal, seat, who, view.tries.length + 1);

  let body: React.ReactNode;
  switch (round.format) {
    case "pick":
    case "agree":
      body = (
        <Landed
          delay={delay}
          options={round.options}
          marks={[
            { seat, at: pick(seat) },
            { seat: partnerSeat, at: pick(partnerSeat) },
          ]}
        />
      );
      break;
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      const own = (s: Seat) => (s === seat ? "Your" : `${names[s]}’s`);
      body = (
        <Landed
          delay={delay}
          options={round.options}
          marks={[
            { seat: subject, at: pick(subject), caption: `${own(subject)} pick` },
            { seat: guesser, at: pick(guesser), caption: `${own(guesser)} guess` },
          ]}
        />
      );
      break;
    }
    case "likely":
      body = (
        <div className="flex flex-col gap-2.5">
          {round.items.map((item, i) => {
            const landed = likelyItem(pick("host", i), pick("guest", i));
            const agreed = landed?.kind === "agreed";
            const line =
              landed?.kind === "agreed"
                ? `${who(landed.named, true)}, undisputed.`
                : landed?.kind === "both-claim"
                  ? "You both claim it."
                  : `You say ${who(partnerSeat)}. ${names[partnerSeat]} says ${who(seat)}.`;
            return (
              <Arrive key={i} delay={delay + i * 0.08} className={`rounded-[1.125rem] px-4 py-3.5 ${agreed ? "bg-blush" : "bg-tile"}`}>
                <p className="text-balance text-muted">{t(item.text)}</p>
                <p className="mt-1 text-lg font-bold">{line}</p>
              </Arrive>
            );
          })}
        </div>
      );
      break;
    case "scale": {
      const self = (s: Seat) => pick(s) ?? 0;
      const guessOf = (s: Seat) => reveal[other(s)].guesses?.[0] ?? 0;
      body = (
        <Arrive delay={delay} className="flex flex-col gap-5 rounded-[1.125rem] bg-tile p-4">
          {[seat, partnerSeat].map((s) => (
            <div key={s} className="flex flex-col gap-2">
              <p className="flex justify-between gap-3">
                <b className="font-bold">{s === seat ? "You" : names[s]}</b>
                <span className={guessOf(s) === self(s) ? "font-bold text-red" : "font-medium text-muted"}>
                  {guessOf(s) === self(s)
                    ? `${who(other(s), true)} nailed it`
                    : `${who(other(s), true)} ${other(s) === seat ? "were" : "was"} ${Math.abs(guessOf(s) - self(s))} off`}
                </span>
              </p>
              <ScaleTrack steps={round.steps} at={self(s)} guess={guessOf(s)} owner={s} guesser={other(s)} />
            </div>
          ))}
          <ScaleEnds left={t(round.left)} right={t(round.right)} />
        </Arrive>
      );
      break;
    }
    case "speed":
      body = (
        <div className="flex flex-col gap-2">
          {round.items.map((pair, i) => {
            const same = pick("host", i) != null && pick("host", i) === pick("guest", i);
            return (
              <Arrive key={i} delay={delay + i * 0.06} className={`grid grid-cols-2 gap-2 rounded-2xl p-2 ${same ? "bg-blush" : "bg-tile"}`}>
                {pair.map((option, j) => {
                  const byMe = pick(seat, i) === j;
                  const byThem = pick(partnerSeat, i) === j;
                  return (
                    <span key={j} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${byMe || byThem ? "bg-white font-bold" : "text-muted"}`}>
                      {t(option.label)}
                      <span className="flex -space-x-1.5">
                        {byMe && <Avatar player={view.players[seat]!} tone="me" size={20} />}
                        {byThem && <Avatar player={view.players[partnerSeat]!} tone="partner" size={20} />}
                      </span>
                    </span>
                  );
                })}
              </Arrive>
            );
          })}
        </div>
      );
      break;
    case "write": {
      const textOf = (s: Seat, slot: ViewText["slot"]) => reveal.texts.find((x) => x.seat === s && x.slot === slot);
      if (round.variant === "mirror") {
        body = (
          <div className="flex flex-col gap-7">
            {[seat, partnerSeat].map((s) => {
              const guess = textOf(other(s), "partner");
              return (
                <div key={s}>
                  <Apart
                    delay={delay}
                    left={{ seat: s, caption: `${who(s, true)} said`, text: textOf(s, "self")?.body ?? "" }}
                    right={{ seat: other(s), caption: `${who(other(s), true)} guessed`, text: guess?.body ?? "" }}
                  />
                  <Vibe delay={delay + 0.3} pct={guess?.matchPct} />
                </div>
              );
            })}
          </div>
        );
      } else {
        const mine = textOf(seat, "shared");
        const theirs = textOf(partnerSeat, "shared");
        body = (
          <>
            <Apart
              delay={delay}
              left={{ seat, caption: "You", text: mine?.body ?? "" }}
              right={{ seat: partnerSeat, caption: names[partnerSeat], text: theirs?.body ?? "" }}
            />
            <Vibe delay={delay + 0.3} pct={averagePct([mine?.matchPct, theirs?.matchPct])} />
          </>
        );
      }
      break;
    }
  }

  return (
    <Stage
      aside={
        <>
          {!reduce && <Flash text={verdict.text} tone={verdict.tone} />}
          <p className="text-[0.95rem] font-bold text-navy">{round.scene.time}</p>
          <p className="text-[0.95rem] font-medium text-muted">{t(round.scene.title)}</p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 420, damping: 20 }}
            className="mt-3 origin-left text-[2.1rem] leading-[1.02] font-black tracking-[-0.02em] text-balance lg:mt-4 lg:text-[3.5rem] lg:leading-[0.98]"
          >
            {verdict.text}
          </motion.h1>
        </>
      }
    >
      <p className="-mt-1 text-lg leading-snug font-medium text-balance text-muted lg:mt-0">{t(promptFor(round, seat))}</p>
      <div className="mt-3">{body}</div>
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
    </Stage>
  );
}

/**
 * The Wrapped moment: one bold color takes the whole screen, the verdict springs in, then it
 * clears. The color bursts out of the action button, where the press that caused it happened.
 */
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
          <Burst key="flash" className={TONE_BG[tone]} color={TONE_TEXT[tone]} onClick={() => setShow(false)}>
            <motion.p
              initial={{ scale: 0.5, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 13 }}
              className="max-w-md text-center text-[clamp(2.75rem,13vw,4.75rem)] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:max-w-4xl lg:text-[7rem]"
            >
              {text}
            </motion.p>
          </Burst>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/** A full-screen layer that opens as a circle from the action button (measured once it's on screen). */
function Burst({ className, color, onClick, children }: { className: string; color: string; onClick: () => void; children: React.ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  useLayoutEffect(() => {
    const r = document.querySelector("[data-primary-action]")?.getBoundingClientRect();
    const at = r ? `${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px` : "50% 90%";
    animate(scope.current, { clipPath: [`circle(0% at ${at})`, `circle(150% at ${at})`] }, { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] });
  }, [animate, scope]);
  return (
    <motion.div
      ref={scope}
      className={`fixed inset-0 z-30 grid place-items-center px-6 ${className}`}
      style={{ clipPath: "circle(0% at 50% 90%)", color }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={onClick}
    >
      {children}
    </motion.div>
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

type Mark = { seat: Seat; at: number | null | undefined; caption?: string };

/**
 * Every option, in the same order as the question, with each face landing on the one that
 * person chose. A shared pick turns pink and gets a heart; options nobody chose fade back.
 */
function Landed({ options, marks, delay }: { options: Option[]; marks: Mark[]; delay: number }) {
  const { view, seat, t } = useRoomContext();
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((option, i) => {
        const here = marks.filter((m) => m.at === i).sort((a, b) => Number(b.seat === seat) - Number(a.seat === seat));
        const both = here.length === 2;
        const caption = here.length === 1 ? here[0]!.caption : undefined;
        return (
          <Arrive
            key={i}
            delay={delay + i * 0.05}
            className={`flex min-h-[3.75rem] items-center gap-3 rounded-[1.125rem] border-2 px-4 py-2.5 ${
              both ? "border-transparent bg-blush" : here.length ? "border-transparent bg-tile" : "border-tile"
            }`}
          >
            <span className={`flex-1 text-[1.0625rem] leading-tight ${here.length ? "font-bold" : "font-medium text-muted/70"}`}>{t(option.label)}</span>
            {caption && <span className="text-sm font-semibold whitespace-nowrap text-muted">{caption}</span>}
            {here.length > 0 && (
              <span className="flex flex-none items-center">
                {here.map((m, j) => (
                  <motion.span
                    key={m.seat}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: delay + 0.3 + j * 0.1, type: "spring", stiffness: 500, damping: 15 }}
                    className={`rounded-full ${j ? "-ml-2.5 ring-[3px] ring-blush" : ""}`}
                  >
                    <Avatar player={view.players[m.seat]!} tone={m.seat === seat ? "me" : "partner"} size={32} />
                  </motion.span>
                ))}
                {both && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ delay: delay + 0.6, duration: 0.45 }} className="ml-2 text-red">
                    <Heart size={22} />
                  </motion.span>
                )}
              </span>
            )}
          </Arrive>
        );
      })}
    </div>
  );
}

type Side = { seat: Seat; caption: string; text: string };

/** Different answers: two tiles that slide in a short way from opposite sides (never off-screen). */
function Apart({ left, right, delay }: { left: Side; right: Side; delay: number }) {
  const { view, seat } = useRoomContext();
  const tile = (side: Side, from: number) => {
    const player = view.players[side.seat];
    return (
      <motion.div
        initial={{ opacity: 0, x: from }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
        className="flex min-h-36 flex-col gap-2 rounded-[1.125rem] bg-tile p-4"
      >
        {player && <Avatar player={player} tone={side.seat === seat ? "me" : "partner"} size={36} />}
        <p className="text-sm font-semibold text-muted">{side.caption}</p>
        <p className="text-lg leading-snug font-bold">{side.text}</p>
      </motion.div>
    );
  };
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tile(left, -16)}
      {tile(right, 16)}
    </div>
  );
}

function Vibe({ pct, delay }: { pct: number | null | undefined; delay: number }) {
  const word = vibeWord(pct);
  if (!word) return null;
  return (
    <Arrive delay={delay} className="mt-3 flex items-baseline gap-2">
      <span className="text-xl font-black">{word}</span>
      <span className="text-sm text-muted">{pct}% vibe match</span>
    </Arrive>
  );
}

/** Each person's own spot on the scale, with the other person's guess as a smaller face. */
function ScaleTrack({ steps, at, guess, owner, guesser }: { steps: number; at: number; guess: number; owner: Seat; guesser: Seat }) {
  const { view, seat } = useRoomContext();
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }} aria-hidden>
      {Array.from({ length: steps }, (_, i) => (
        <span key={i} className="relative grid aspect-square place-items-center rounded-full bg-white">
          {i === at && <Avatar player={view.players[owner]!} tone={owner === seat ? "me" : "partner"} size={30} />}
          {i === guess && (
            <span className={`rounded-full ring-2 ring-white ${i === at ? "absolute -right-1 -bottom-1" : ""}`}>
              <Avatar player={view.players[guesser]!} tone={guesser === seat ? "me" : "partner"} size={i === at ? 18 : 22} />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
