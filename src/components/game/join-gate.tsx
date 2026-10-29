"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NavyHeadline, NavyPage } from "@/components/ui/navy-page";
import { GameClosed } from "./game-closed";

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

  if (error) return <GameClosed message={error} />;
  return (
    <NavyPage>
      <NavyHeadline>Joining game {code}…</NavyHeadline>
    </NavyPage>
  );
}
