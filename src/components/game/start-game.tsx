"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Mode } from "@/game/engine";

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
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.push(`/play/${data.code}`);
    else {
      setError(data.error ?? "Couldn't start a game.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => start("couple")}
        className="rounded bg-black px-4 py-3 text-white disabled:opacity-40"
      >
        Start a game: we&apos;re a couple
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => start("friends")}
        className="rounded border px-4 py-3 disabled:opacity-40"
      >
        Start a game: we&apos;re friends (parallel universe)
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
