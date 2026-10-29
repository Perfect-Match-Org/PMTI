import { DayDeck } from "@/components/game/day-deck";
import { plannedLength } from "@/game/engine";
import { CURRENT_DECK } from "@/game/decks";
import { BrandHeader } from "./brand-header";

/** What the game is, in one breath. Pages can add a sentence of their own. */
export function Pitch({ children }: { children?: React.ReactNode }) {
  return (
    <p className="max-w-[30rem] text-[1.1875rem] leading-[1.4] text-white/85 lg:text-[1.375rem]">
      {plannedLength(CURRENT_DECK)} quick rounds, each on your own phone. Pick in secret, reveal together, and find out what kind of duo you are.
      {children}
    </p>
  );
}

/**
 * The navy poster at the top of the landing and invite pages. On a wide screen the headline runs
 * across the whole frame and the deck of rounds tucks up beside its last line; on a phone the
 * deck follows the actions. It sizes to its content, so the next section peeks in below.
 * `eyebrow` is a pink line above the headline, like "You two are" above a result.
 */
export function Hero({ eyebrow, children }: { eyebrow?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id="top" data-navy className="overflow-x-clip bg-navy text-white">
      <div className="frame pt-5 pb-14 lg:pt-8 lg:pb-24">
        <BrandHeader />
        <div className="grid pt-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-x-16 lg:pt-14 xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-x-20">
          {eyebrow && <p className="mb-4 flex items-center gap-3 text-xl font-bold text-pink lg:col-span-2 lg:mb-5 lg:text-2xl">{eyebrow}</p>}
          <h1 className="text-[clamp(3.25rem,17vw,5rem)] leading-[0.88] font-black tracking-[-0.04em] lg:col-span-2 lg:text-[clamp(5rem,11vw,8.75rem)]">
            A Cornell day <br className="max-lg:hidden" />
            for two.
          </h1>
          <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:gap-10">{children}</div>
          {/* Pulled up by one headline line (less a little air), into the space beside "for two." */}
          <div className="relative z-10 mt-14 lg:-mt-[calc(0.88*clamp(5rem,11vw,8.75rem)_-_2.75rem)]">
            <DayDeck />
          </div>
        </div>
      </div>
    </section>
  );
}
