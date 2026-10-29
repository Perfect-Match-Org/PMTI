import { PmLogo } from "./pm-logo";

/** The Perfect Match mark beside the game's name, at the top of every navy page. */
export function BrandHeader() {
  return (
    <header className="flex items-center gap-3">
      <PmLogo gap="var(--color-navy)" className="h-9 w-auto text-white lg:h-10" />
      <span className="h-6 w-0.5 rounded-full bg-white/25" />
      <span className="text-xl font-black tracking-[-0.01em]">PMTI</span>
    </header>
  );
}
