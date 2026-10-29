"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { usePrefersReducedMotion } from "@/client/motion";
import { useEffect, useRef, useState } from "react";
import { DUO_TYPES, type DuoType } from "@/game/types";
import { DuoCardFace, type CardPerson } from "@/components/ui/duo-card";
import { PairName } from "@/components/ui/pair-name";
import { SAMPLE_PLAYERS } from "./sample-day";

const PEOPLE: [CardPerson, CardPerson] = [
  { name: SAMPLE_PLAYERS.host.name, tone: "me" },
  { name: SAMPLE_PLAYERS.guest.name, tone: "partner" },
];
const STAY_MS = 3600;

/**
 * Where the day ends: the result card, cycling through every pair a game can end on, beside an index
 * of all of them, played by the same sample couple as the deck above.
 */
export function DuoShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const still = usePrefersReducedMotion();
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
          <DuoCardFace type={t} lead="You two are" people={PEOPLE} />
        </div>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={type.id} className="[grid-area:1/1]" exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.18 }}>
          <DuoCardFace type={type} lead="You two are" people={PEOPLE} live />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
