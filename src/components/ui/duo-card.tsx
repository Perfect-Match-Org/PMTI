"use client";

import { splitPair, type DuoType } from "@/game/types";
import { Avatar } from "./avatar";
import { Joiner } from "./pair-name";
import { Rise } from "./rise";

/** Whoever holds one half; a null name means they keep it off the card, and nothing is shown for them. */
export type CardPerson = { name: string | null; tone: "me" | "partner" };

/**
 * A duo result as a card. The pair's name is split into its two halves, each place once with its role
 * under it, and a person's name beside their half only if they show it, so nothing repeats either way.
 * The landing shows its sample couple; the public share page shows a real pair.
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
  const { first, joiner, second } = splitPair(type.name);
  const titles = second ? [first, <><Joiner word={joiner!} /> {second}</>] : [type.name, null];
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.95rem] leading-snug lg:text-lg">
        <b className="font-bold">11:58pm</b>
        <span className="block text-white/70">That’s the day.</span>
      </p>
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="font-bold text-pink lg:text-lg">{lead}</p>
        <div className="mt-3 flex flex-col gap-4">
          {type.halves.map((half, i) => {
            const person = people[i]!;
            return (
              <Rise as="div" key={i} delay={live ? 0.05 + i * 0.15 : 0} className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[2.1rem] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:text-[2.25rem] xl:text-[2.6rem]">
                    {titles[i]}
                  </h3>
                  <p className="mt-1.5 text-sm leading-snug text-white/65 lg:text-base">{half.line}</p>
                </div>
                {person.name && (
                  <span className="mt-1 flex flex-none items-center gap-1.5 rounded-full bg-white/10 py-1 pr-3 pl-1 text-sm font-bold">
                    <Avatar player={{ name: person.name, avatarUrl: null }} tone={person.tone} size={24} />
                    {person.name}
                  </span>
                )}
              </Rise>
            );
          })}
        </div>
        <Rise delay={live ? 0.45 : 0} className="mt-6 text-xl font-bold text-pink">
          {type.nickname}
        </Rise>
        <Rise delay={live ? 0.55 : 0} className="mt-1 text-lg leading-snug text-white/75">
          {type.tagline}
        </Rise>
      </div>
      {footer}
    </div>
  );
}
