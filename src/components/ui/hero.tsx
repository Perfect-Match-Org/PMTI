import { DayDeck } from "@/components/game/day-deck";
import { PmLogo } from "./pm-logo";

/**
 * The navy poster at the top of the landing and invite pages: the words and actions, then the deck
 * of rounds playing itself. Side by side on a wide screen; on a phone the deck follows the actions.
 * It sizes to its content, so on a laptop the top of the next section shows and invites a scroll.
 */
export function Hero({ title, compact = false, children }: { title: React.ReactNode; compact?: boolean; children: React.ReactNode }) {
  const size = compact
    ? "text-[clamp(3rem,15vw,4.25rem)] lg:text-[clamp(3.25rem,4.5vw,4.5rem)]"
    : "text-[clamp(3.25rem,17vw,5rem)] lg:text-[clamp(4rem,6vw,6rem)]";
  return (
    <section className="overflow-x-clip bg-navy text-white">
      <div className="frame flex flex-col pt-5 pb-14 lg:pt-8 lg:pb-24">
        <header className="flex items-center gap-3">
          <PmLogo gap="var(--color-navy)" className="h-9 w-auto text-white lg:h-10" />
          <span className="h-6 w-0.5 rounded-full bg-white/25" />
          <span className="text-xl font-black tracking-[-0.01em]">PMTI</span>
        </header>
        <div className="grid gap-x-20 pt-12 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center lg:pt-16">
          <div className="flex flex-col gap-6">
            <h1 className={`${size} leading-[0.9] font-black tracking-[-0.035em]`}>{title}</h1>
            {children}
          </div>
          <DayDeck />
        </div>
      </div>
    </section>
  );
}
