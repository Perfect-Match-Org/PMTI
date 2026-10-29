"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Axis } from "@/game/deck";
import { getDeck } from "@/game/decks";

import { momentMood, momentText } from "@/game/moments";
import type { Moment, Result } from "@/game/scoring";
import { duoType, type DuoType } from "@/game/types";
import { Avatar } from "@/components/ui/avatar";
import { PairName } from "@/components/ui/pair-name";
import { BrokenHeart, Heart } from "@/components/ui/heart";
import { Portal } from "@/components/ui/portal";
import { ActionBar } from "./action-bar";
import { useRoomContext } from "./room-context";
import { Stage } from "./stage";

const SLIDE_MS = 4000;
const MOMENT_TONES = ["bg-white text-ink", "bg-blush text-ink", "bg-navy text-white"];

export function ResultView({ result }: { result: Result }) {
  const [stage, setStage] = useState<"story" | "summary">("story");
  const type = duoType(result.type);
  if (!type) return <p className="pt-10 text-xl">Your result is from an older version of the game.</p>;
  return stage === "story" ? (
    <ResultStory result={result} type={type} onDone={() => setStage("summary")} />
  ) : (
    <ResultSummary result={result} type={type} />
  );
}

/** A moment that backs up the mind-reading number instead of contradicting it. */
function mindMomentFor(result: Result): Moment | undefined {
  const good = result.mindReading >= 0.5;
  return result.moments.find((m) =>
    m.kind === "mind" ? m.hit === good : m.kind === "mirror" ? m.pct >= 60 === good : m.kind === "close-call" && good
  );
}

type Slide = { tone: string; body: React.ReactNode };

/** Wrapped-style story: full-screen color slides that advance on their own; tap to move, or skip. */
function ResultStory({ result, type, onDone }: { result: Result; type: DuoType; onDone: () => void }) {
  const { view, seat, partnerSeat, names, t } = useRoomContext();
  const [index, setIndex] = useState(0);
  const deck = getDeck(view.deckId);
  const say = (m: Moment) => (deck ? momentText(m, { deck, names, viewer: seat, t }) : "");
  const mindMoment = mindMomentFor(result);
  const words = type.name.split(" ");

  const slides: Slide[] = [
    {
      tone: "bg-navy text-white",
      body: (
        <>
          <Rise className="text-[clamp(3.25rem,17vw,5rem)] leading-[0.92] font-black tracking-[-0.03em]">That’s the day.</Rise>
          <Rise delay={0.35} className="mt-5 text-xl leading-snug text-white/80">
            {view.totalSteps} rounds, one Cornell Tuesday. Here’s how you two did.
          </Rise>
        </>
      ),
    },
    {
      tone: "bg-pink text-ink",
      body: (
        <>
          <p className="text-[clamp(6rem,36vw,9rem)] leading-[0.85] font-black tracking-[-0.04em]">
            <CountUp to={Math.round(result.sameBrain * 100)} />
          </p>
          <Rise delay={0.5} className="mt-3 text-3xl font-extrabold">
            same brain
          </Rise>
        </>
      ),
    },
    {
      tone: "bg-red text-white",
      body: (
        <>
          <p className="text-[clamp(6rem,36vw,9rem)] leading-[0.85] font-black tracking-[-0.04em]">
            <CountUp to={Math.round(result.mindReading * 100)} />
          </p>
          <Rise delay={0.5} className="mt-3 text-3xl font-extrabold">
            mind reading
          </Rise>
          {mindMoment && (
            <Rise delay={0.8} className="mt-3 text-xl leading-snug text-balance text-white/90">
              {say(mindMoment)}
            </Rise>
          )}
        </>
      ),
    },
    ...result.moments
      .filter((m) => m !== mindMoment)
      .map((m, i) => ({
        tone: MOMENT_TONES[i % MOMENT_TONES.length]!,
        body: (
          <>
            <MomentIcon moment={m} size={40} />
            <Rise delay={0.15} className="mt-5 text-[clamp(2rem,9vw,2.75rem)] leading-[1.05] font-black tracking-[-0.02em] text-balance">
              {say(m)}
            </Rise>
          </>
        ),
      })),
    {
      tone: "bg-ink text-white",
      body: (
        <>
          <Rise className="text-2xl font-bold text-pink">
            {view.mode === "friends" ? "In a parallel universe where you two date, you’d be" : "You two are"}
          </Rise>
          <h2 className="mt-3 text-[clamp(2.75rem,13vw,4rem)] leading-[0.95] font-black tracking-[-0.03em]">
            <PairName name={type.name} spring={{ delay: 0.6 }} />
          </h2>
          <Rise delay={0.8 + words.length * 0.12} className="mt-5 text-2xl font-bold text-pink">
            {type.nickname}
          </Rise>
          <Rise delay={1 + words.length * 0.12} className="mt-1 text-xl text-white/80">
            {type.tagline}
          </Rise>
        </>
      ),
    },
    {
      tone: "bg-pink text-ink",
      body: (
        <div className="flex flex-col gap-4">
          {[seat, partnerSeat].map((s, i) => {
            const half = type.halves[result.roles[s]];
            const player = view.players[s];
            return (
              <motion.div
                key={s}
                initial={{ x: i ? 40 : -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.25, type: "spring", stiffness: 280, damping: 22 }}
                className="rounded-[1.5rem] bg-white p-5"
              >
                {player && <Avatar player={player} tone={s === seat ? "me" : "partner"} size={44} />}
                <p className="mt-3 text-lg font-semibold text-muted">{s === seat ? "You’re" : `${names[s]} is`}</p>
                <p className="text-3xl leading-tight font-black tracking-[-0.02em]">{half.name}</p>
                <p className="mt-1 text-lg leading-snug text-muted">{half.line}.</p>
              </motion.div>
            );
          })}
        </div>
      ),
    },
  ];

  const last = slides.length - 1;
  const next = useCallback(() => (index >= last ? onDone() : setIndex(index + 1)), [index, last, onDone]);
  const back = useCallback(() => setIndex(Math.max(0, index - 1)), [index]);
  useEffect(() => {
    const id = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(id);
  }, [next]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onDone]);

  const slide = slides[index]!;
  return (
    <Portal>
      <div className={`fixed inset-0 z-30 overflow-hidden transition-colors duration-300 md:grid md:place-items-center ${slide.tone} md:bg-tile`} aria-live="polite">
        <div
          className={`relative mx-auto flex h-full max-w-md flex-col px-5 pt-4 pb-10 transition-colors duration-300 md:aspect-[9/16] md:h-[min(calc(100dvh-3rem),56rem)] md:max-w-none md:rounded-[2rem] ${slide.tone}`}
        >
          <div className="flex items-center gap-3">
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${slides.length}, 1fr)` }}>
              {slides.map((_, i) => (
                <span key={i} className="h-1 overflow-hidden rounded-full bg-current/25">
                  {i < index && <span className="block h-full bg-current" />}
                  {i === index && (
                    <span key={index} className="segment-fill block h-full bg-current" style={{ ["--duration" as string]: `${SLIDE_MS}ms` }} />
                  )}
                </span>
              ))}
            </div>
            <button type="button" onClick={onDone} className="relative z-10 font-bold underline-offset-4 hover:underline">
              Skip
            </button>
          </div>
          <div className="relative flex flex-1 flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {slide.body}
              </motion.div>
            </AnimatePresence>
            <button type="button" aria-label="Previous slide" className="absolute inset-y-0 left-0 w-1/3" onClick={back} />
            <button type="button" aria-label="Next slide" className="absolute inset-y-0 right-0 w-2/3" onClick={next} />
          </div>
          <StoryArrow side="left" onClick={back} hidden={index === 0} />
          <StoryArrow side="right" onClick={next} />
        </div>
      </div>
    </Portal>
  );
}

/** Mouse-sized arrows beside the card on a wide screen; on a phone you tap the slide itself. */
function StoryArrow({ side, onClick, hidden = false }: { side: "left" | "right"; onClick: () => void; hidden?: boolean }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClick}
      className={`absolute top-1/2 hidden size-14 -translate-y-1/2 place-items-center rounded-full border-2 border-line bg-white text-ink md:grid ${
        side === "left" ? "-left-20" : "-right-20"
      } ${hidden ? "invisible" : ""}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className={side === "left" ? "rotate-180" : ""}>
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const AXIS_ENDS: Record<Axis, [string, string]> = { E: ["Out", "In"], P: ["Plan", "Wing it"], H: ["Say it", "Show it"] };

function ResultSummary({ result, type }: { result: Result; type: DuoType }) {
  const { view, seat, partnerSeat, names, t } = useRoomContext();
  const router = useRouter();
  const [shared, setShared] = useState(false);
  const deck = getDeck(view.deckId);
  const runnerUp = result.runnerUp ? duoType(result.runnerUp) : undefined;
  const mine = type.halves[result.roles[seat]];

  async function share() {
    const text = `I’m ${mine.name} in a ${type.name} duo (${type.nickname}). What kind of duo are you two?`;
    const url = window.location.origin;
    if (navigator.share) {
      await navigator.share({ title: "PMTI", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
    }
  }

  return (
    <Stage
      aside={
        <>
      <p className="text-lg font-semibold text-muted">{view.mode === "friends" ? "In a parallel universe, you two are" : "You two are"}</p>
      <h1 className="mt-1 text-[clamp(2.5rem,12vw,3.25rem)] leading-[0.98] font-black tracking-[-0.03em] text-balance lg:text-[4rem] lg:leading-[0.95]">
        <PairName name={type.name} />
      </h1>
      <p className="mt-3 text-lg">
        <b className="font-extrabold">{type.nickname}.</b> <span className="text-muted">{type.tagline}</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        {[seat, partnerSeat].map((s) => {
          const half = type.halves[result.roles[s]];
          const player = view.players[s];
          return (
            <div key={s} className="flex flex-col gap-2 rounded-[1.125rem] bg-blush p-4">
              {player && <Avatar player={player} tone={s === seat ? "me" : "partner"} size={36} />}
              <p className="text-sm font-semibold text-muted">
                {s === seat ? "You’re" : `${names[s]} is`} <span className="block text-xl leading-tight font-black text-ink">{half.name}</span>
              </p>
              <p className="text-sm leading-snug text-muted">{half.line}</p>
            </div>
          );
        })}
      </div>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        <div className="px-1">
          <p className="text-5xl font-black tracking-[-0.03em] text-navy">{Math.round(result.sameBrain * 100)}%</p>
          <p className="mt-1 font-semibold text-muted">same brain</p>
        </div>
        <div className="px-1">
          <p className="text-5xl font-black tracking-[-0.03em] text-red">{Math.round(result.mindReading * 100)}%</p>
          <p className="mt-1 font-semibold text-muted">mind reading</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-5" aria-label="Where you each sit">
        {(Object.keys(AXIS_ENDS) as Axis[]).map((axis) => (
          <AxisRail key={axis} axis={axis} result={result} />
        ))}
        {runnerUp && <p className="text-muted">With a streak of {runnerUp.name}.</p>}
      </div>

      {deck && result.moments.length > 0 && (
        <ul className="mt-8 flex flex-col gap-3">
          {result.moments.map((m, i) => (
            <li key={i} className="flex gap-3 text-lg leading-snug">
              <MomentIcon moment={m} size={18} className="mt-1" />
              {momentText(m, { deck, names, viewer: seat, t })}
            </li>
          ))}
        </ul>
      )}

      <ActionBar
        reactions={false}
        secondary={{ label: "Play again", onClick: () => router.push("/") }}
        primary={{ label: shared ? "Copied" : "Share my card", onClick: share }}
      />
    </Stage>
  );
}

/** A rail from one end to the other with both faces on it (the partner's sits behind when you overlap). */
function AxisRail({ axis, result }: { axis: Axis; result: Result }) {
  const { view, seat, partnerSeat } = useRoomContext();
  const [left, right] = AXIS_ENDS[axis];
  const at = (v: number) => `clamp(16px, ${((1 - v) / 2) * 100}%, calc(100% - 16px))`;
  // Side by side when you land in the same spot, so neither face hides the other.
  const overlap = Math.abs(result.axes.host[axis] - result.axes.guest[axis]) < 0.15;
  return (
    <div>
      <div className="flex justify-between text-sm font-bold">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="relative mt-2 h-9">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        {[partnerSeat, seat].map((s) => {
          const player = view.players[s];
          if (!player) return null;
          return (
            <motion.span
              key={s}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-white"
              initial={{ left: "50%" }}
              animate={{ left: at(result.axes[s][axis]), x: overlap ? (s === seat ? 12 : -12) : 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.2 }}
            >
              <Avatar player={player} tone={s === seat ? "me" : "partner"} size={32} />
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function Rise({ delay = 0, className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
      className={className}
    >
      {children}
    </motion.p>
  );
}

function CountUp({ to }: { to: number }) {
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => `${Math.round(v)}%`);
  useEffect(() => {
    const controls = animate(value, to, { duration: 1.3, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [to, value]);
  return <motion.span>{text}</motion.span>;
}

function MomentIcon({ moment, size, className = "" }: { moment: Moment; size: number; className?: string }) {
  if (moment.kind === "reactions") {
    return (
      <span className={`block flex-none leading-none ${className}`} style={{ fontSize: size }}>
        {moment.emoji}
      </span>
    );
  }
  const Icon = momentMood(moment) === "hit" ? Heart : BrokenHeart;
  return <Icon size={size} className={`flex-none text-red ${className}`} />;
}
