"use client";

import type { RoomView } from "@/game/engine";

type Props = {
  view: RoomView;
  link: string;
  intro: string;
  busy: boolean;
  onReady: () => void;
  onKick: () => void;
};

export function Lobby({ view, link, intro, busy, onReady, onKick }: Props) {
  const guest = view.players.guest;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Game {view.code}</h1>
      {!guest ? (
        <>
          <p>Send this link to your {view.mode === "couple" ? "partner" : "friend"}:</p>
          <div className="flex gap-2">
            <input readOnly value={link} aria-label="Invite link" className="flex-1 rounded border px-3 py-2" />
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => void navigator.clipboard.writeText(link)}
            >
              Copy
            </button>
          </div>
          <p className="text-sm opacity-60">Or have them enter code {view.code}. Waiting for them to join…</p>
        </>
      ) : (
        <>
          <p>
            {view.players.host.name} &amp; {guest.name} are in.
          </p>
          <p className="italic">{intro}</p>
          {view.mine.ready ? (
            <p>Ready. Waiting for {view.seat === "host" ? guest.name : view.players.host.name}…</p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onReady}
              className="rounded bg-black px-4 py-3 text-white disabled:opacity-40"
            >
              I&apos;m ready
            </button>
          )}
          {view.seat === "host" && (
            <button type="button" onClick={onKick} className="self-start text-sm underline">
              Not your partner? Remove {guest.name}
            </button>
          )}
        </>
      )}
    </div>
  );
}
