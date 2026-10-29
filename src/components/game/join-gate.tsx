"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandHeader } from "@/components/ui/brand-header";
import { JoinWithCode } from "./join-with-code";

/** Joins on mount (never on a server GET, so link prefetching can't join anyone by accident). */
export function JoinGate({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/rooms/${code}/join`, { method: "POST" });
      if (res.ok) router.refresh();
      else setError((await res.json().catch(() => ({}))).error ?? "Couldn't join this game.");
    })();
  }, [code, router]);

  return (
    <main className="flex min-h-dvh flex-col bg-navy text-white">
      <div className="frame pt-5 lg:pt-8">
        <BrandHeader />
      </div>
      <div className="frame flex flex-col gap-8 pt-12 pb-14 lg:max-w-[40rem] lg:pt-16">
        {error ? (
          <>
            <p role="alert" className="text-[clamp(2.5rem,11vw,4rem)] leading-[0.95] font-black tracking-[-0.03em]">
              {error}
            </p>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-white/70">Have a different code?</p>
              <JoinWithCode placeholder="Six letters and numbers" />
            </div>
            <Link href="/" className="btn btn-pink self-start">
              Start your own game
            </Link>
          </>
        ) : (
          <p className="text-[clamp(2.5rem,11vw,4rem)] leading-[0.95] font-black tracking-[-0.03em]">Joining game {code}…</p>
        )}
      </div>
    </main>
  );
}
