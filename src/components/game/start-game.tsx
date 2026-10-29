"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Mode } from "@/game/engine";
import { ErrorNote } from "@/components/ui/error-note";

export function StartGame() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(mode: Mode) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok) return router.push(`/play/${data.code}`);
    setError(res ? (data.error ?? "Couldn’t start a game.") : "Couldn’t reach the server. Check your connection and try again.");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => start("couple")}
        className="btn btn-pink"
      >
        Play with my partner
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => start("friends")}
        className="btn btn-ghost"
      >
        Play with a friend
      </button>
      {error && (
        <ErrorNote className="lg:col-span-2">{error}</ErrorNote>
      )}
    </div>
  );
}
