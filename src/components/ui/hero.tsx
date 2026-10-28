/**
 * The navy poster behind the landing and invite pages. On a phone it's one column pinned to the
 * bottom; on a wide screen the headline takes the left and the actions sit beside it.
 */
export function Hero({ title, compact = false, children }: { title: React.ReactNode; compact?: boolean; children: React.ReactNode }) {
  const size = compact
    ? "text-[clamp(3rem,15vw,4.25rem)] lg:text-[clamp(3.5rem,5vw,5rem)]"
    : "text-[clamp(3.25rem,17vw,5rem)] lg:text-[clamp(4.5rem,7vw,6.75rem)]";
  return (
    <main className="min-h-dvh bg-navy text-white">
      <div className="mx-auto grid min-h-dvh max-w-md content-end gap-6 px-5 pt-10 pb-12 lg:max-w-6xl lg:grid-cols-[1.4fr_1fr] lg:content-center lg:items-end lg:gap-x-20 lg:px-12 lg:pb-20">
        <div className="flex flex-col gap-6">
          <p className="text-xl font-black text-pink">PMTI</p>
          <h1 className={`${size} leading-[0.9] font-black tracking-[-0.035em]`}>{title}</h1>
        </div>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </main>
  );
}
