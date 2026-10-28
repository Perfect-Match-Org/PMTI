"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    <main data-phase="morning" className="stage">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
        {error ? (
          <>
            <p role="alert" className="font-display text-3xl leading-tight">
              {error}
            </p>
            <Link href="/" className="btn self-start">
              Start your own game
            </Link>
          </>
        ) : (
          <p className="font-display text-3xl">Joining game {code}…</p>
        )}
      </div>
    </main>
  );
}
