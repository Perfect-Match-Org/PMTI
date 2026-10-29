"use client";

import { motion } from "motion/react";
import type { DuoType } from "@/game/types";
import { Avatar } from "./avatar";
import { afterPairName, PairName } from "./pair-name";
import { Rise } from "./rise";

/** Whoever holds one half; a null name stays a plain circle (a player who keeps their name off the card). */
export type CardPerson = { name: string | null; tone: "me" | "partner" };

/**
 * A duo result as a card: the pair's name, nickname and tagline, then which half each person is.
 * The landing shows it for its sample couple; the public share page shows a real pair's.
 */
export function DuoCardFace({
  type,
  lead,
  people,
  live = false,
  footer,
}: {
  type: DuoType;
  lead: string;
  people: [CardPerson, CardPerson];
  live?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.95rem] leading-snug lg:text-lg">
        <b className="font-bold">11:58pm</b>
        <span className="block text-white/70">That’s the day.</span>
      </p>
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="font-bold text-pink lg:text-lg">{lead}</p>
        <h3 className="mt-2 text-[2.4rem] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:text-[2.5rem] xl:text-[3rem]">
          <PairName name={type.name} stack spring={live ? { delay: 0.05 } : undefined} />
        </h3>
        <Rise delay={afterPairName(type.name, 0.2)} className="mt-4 text-xl font-bold text-pink">
          {type.nickname}
        </Rise>
        <Rise delay={afterPairName(type.name, 0.3)} className="mt-1 text-lg leading-snug text-white/75">
          {type.tagline}
        </Rise>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {type.halves.map((half, i) => {
          const person = people[i]!;
          return (
            <div key={i} className="flex flex-col rounded-2xl bg-white/[0.08] p-3.5">
              <motion.span
                className="self-start rounded-full ring-2 ring-white/25"
                {...(live ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.15 + i * 0.1, type: "spring", stiffness: 500, damping: 16 } } : {})}
              >
                {person.name ? (
                  <Avatar player={{ name: person.name, avatarUrl: null }} tone={person.tone} size={32} />
                ) : (
                  <span className={`block size-8 rounded-full ${person.tone === "me" ? "bg-navy" : "bg-pink"}`} />
                )}
              </motion.span>
              {person.name && <p className="mt-2.5 text-xs font-semibold text-white/60">{person.name} is</p>}
              <p className={`text-lg leading-tight font-black ${person.name ? "" : "mt-2.5"}`}>{half.name}</p>
              <p className="mt-1 text-xs leading-snug text-white/60 lg:text-sm">{half.line}</p>
            </div>
          );
        })}
      </div>
      {footer}
    </div>
  );
}
