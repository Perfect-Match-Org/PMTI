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
        <p role="alert" className="rounded-2xl bg-white px-4 py-3 font-semibold text-red-deep lg:col-span-2">
          {error}
        </p>
      )}
    </div>
  );
}
