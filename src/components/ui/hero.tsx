import { VerdictReel } from "@/components/game/verdict-reel";

/**
 * The navy poster behind the landing and invite pages. On a phone it's one column pinned to the
 * bottom, with the verdict reel in the space above when the screen is tall enough; on a wide
 * screen the words and actions take the left and the reel the right.
 */
export function Hero({ title, compact = false, children }: { title: React.ReactNode; compact?: boolean; children: React.ReactNode }) {
  const size = compact
    ? "text-[clamp(3rem,15vw,4.25rem)] lg:text-[clamp(3.25rem,4.5vw,4.5rem)]"
    : "text-[clamp(3.25rem,17vw,5rem)] lg:text-[clamp(4rem,6vw,6rem)]";
  return (
    <main className="min-h-dvh bg-navy text-white">
      <div className="mx-auto grid min-h-dvh max-w-md content-end gap-6 px-5 pt-10 pb-12 lg:max-w-6xl lg:grid-cols-[1fr_minmax(0,26rem)] lg:content-center lg:items-center lg:gap-x-20 lg:px-12 lg:py-16">
        <div className="max-lg:[@media(max-height:759px)]:hidden lg:order-2">
          <VerdictReel />
        </div>
        <div className="flex flex-col gap-6 lg:order-1">
          <p className="text-xl font-black text-pink">PMTI</p>
          <h1 className={`${size} leading-[0.9] font-black tracking-[-0.035em]`}>{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
