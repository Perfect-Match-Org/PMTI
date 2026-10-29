"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PlayerInfo } from "@/game/engine";
import { DUO_TYPES, type DuoType } from "@/game/types";
import { Avatar } from "./avatar";
import { PairName } from "./pair-name";

const PLAYERS: [PlayerInfo, PlayerInfo] = [
  { name: "Sam", avatarUrl: null },
  { name: "Jordan", avatarUrl: null },
];
const STAY_MS = 3600;

/**
 * Where the day ends: the result card, cycling through every pair a game can end on, beside an index
 * of all of them. Sam and Jordan are the couple from the deck above.
 */
export function DuoShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const still = !!useReducedMotion();
  const [active, setActive] = useState(() => DUO_TYPES.findIndex((t) => t.id === "slope-mcgraw"));
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!inView || still || held) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % DUO_TYPES.length), STAY_MS);
    return () => clearTimeout(id);
  }, [inView, still, held, active]);

  return (
    <section className="bg-white text-ink">
      <div className="frame grid py-16 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center lg:gap-x-16 lg:py-28 xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-x-20">
        <div className="lg:col-start-1 lg:row-start-1">
          <h2 className="text-[2.75rem] leading-[0.95] font-black tracking-[-0.03em] lg:text-[4.5rem]">
            Which two
            <br />
            are you?
          </h2>
          <p className="mt-4 max-w-md text-xl leading-snug lg:mt-6 lg:text-2xl">
            By the end of the day, your answers make you a pair of Cornell places, one for each of you.
          </p>
        </div>
        <div
          ref={ref}
          className="mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
        >
          <DuoCard type={DUO_TYPES[active]!} />
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <ul className="mt-10 grid grid-cols-2 gap-x-5 lg:mt-12 lg:gap-x-8">
            {DUO_TYPES.map((type, i) => (
              <li key={type.id}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative w-full border-t-2 border-line py-3 text-left text-[0.95rem] leading-tight font-black transition-colors lg:text-lg lg:leading-[1.15] xl:text-xl ${
                    i === active ? "text-ink" : "text-ink/35 pointer-fine:hover:text-ink/70"
                  }`}
                >
                  {i === active && <motion.span layoutId="duo-index" className="absolute inset-x-0 -top-0.5 h-0.5 bg-ink" />}
                  <PairName name={type.name} stack />
                </button>
              </li>
            ))}
          </ul>
          <a href="#top" className="btn btn-primary mt-10 w-full lg:w-auto">
            Find out which two you are
          </a>
        </div>
      </div>
    </section>
  );
}

/** The game's last card for one pair. Every pair is laid out invisibly underneath, so the card keeps one height. */
function DuoCard({ type }: { type: DuoType }) {
  return (
    <div className="grid rounded-[1.75rem] bg-ink p-6 text-white shadow-[0_40px_80px_-40px_rgba(21,42,94,0.6)] lg:rounded-[2.25rem] lg:p-8">
      {DUO_TYPES.map((t) => (
        <div key={t.id} aria-hidden className="invisible [grid-area:1/1]">
          <CardFace type={t} />
        </div>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={type.id} className="[grid-area:1/1]" exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <CardFace type={type} live />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CardFace({ type, live = false }: { type: DuoType; live?: boolean }) {
  const words = type.name.split(" ").length;
  const rise = (delay: number) =>
    live ? { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay, type: "spring" as const, stiffness: 300, damping: 24 } } : {};
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.95rem] leading-snug lg:text-lg">
        <b className="font-bold">11:58pm</b>
        <span className="block text-white/70">That’s the day.</span>
      </p>
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="font-bold text-pink lg:text-lg">You two are</p>
        <h3 className="mt-2 text-[2.4rem] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:text-[2.5rem] xl:text-[3rem]">
          <PairName name={type.name} stack spring={live ? { delay: 0.05 } : undefined} />
        </h3>
        <motion.p {...rise(0.2 + words * 0.12)} className="mt-4 text-xl font-bold text-pink">
          {type.nickname}
        </motion.p>
        <motion.p {...rise(0.3 + words * 0.12)} className="mt-1 text-lg leading-snug text-white/75">
          {type.tagline}
        </motion.p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {type.halves.map((half, i) => (
          <div key={i} className="flex flex-col rounded-2xl bg-white/[0.08] p-3.5">
            <motion.span
              className="self-start rounded-full ring-2 ring-white/25"
              {...(live ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.15 + i * 0.1, type: "spring", stiffness: 500, damping: 16 } } : {})}
            >
              <Avatar player={PLAYERS[i]!} tone={i ? "partner" : "me"} size={32} />
            </motion.span>
            <p className="mt-2.5 text-xs font-semibold text-white/60">{PLAYERS[i]!.name} is</p>
            <p className="text-lg leading-tight font-black">{half.name}</p>
            <p className="mt-1 text-xs leading-snug text-white/60 lg:text-sm">{half.line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
