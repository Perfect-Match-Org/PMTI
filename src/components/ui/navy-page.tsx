import { BrandHeader } from "./brand-header";

/** A plain navy page under the brand header, for the moments between the landing and a game. */
export function NavyPage({ children }: { children: React.ReactNode }) {
  return (
    <main data-navy className="flex min-h-dvh flex-col bg-navy text-white">
      <div className="frame pt-5 lg:pt-8">
        <BrandHeader />
      </div>
      <div className="frame pt-12 pb-14 lg:pt-16">
        <div className="flex max-w-[40rem] flex-col gap-8">{children}</div>
      </div>
    </main>
  );
}

export function NavyHeadline({ alert = false, children }: { alert?: boolean; children: React.ReactNode }) {
  return (
    <p role={alert ? "alert" : undefined} className="text-[clamp(2.5rem,11vw,4rem)] leading-[0.95] font-black tracking-[-0.03em]">
      {children}
    </p>
  );
}
