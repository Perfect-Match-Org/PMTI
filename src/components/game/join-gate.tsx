"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
        {error ? (
          <>
            <p role="alert" className="text-4xl leading-tight font-black tracking-[-0.02em]">
              {error}
            </p>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-muted">Have a different code?</p>
              <JoinWithCode tone="white" placeholder="Six letters and numbers" />
            </div>
            <Link href="/" className="btn btn-primary self-start">
              Start your own game
            </Link>
          </>
        ) : (
          <p className="text-4xl font-black tracking-[-0.02em]">Joining game {code}…</p>
        )}
      </div>
    </main>
  );
}
