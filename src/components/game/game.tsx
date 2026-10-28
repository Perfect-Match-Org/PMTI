"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoom } from "@/client/useRoom";
import { say } from "@/game/copy";
import type { Copy } from "@/game/deck";
import { getDeck } from "@/game/decks";
import { LOBBY_ROUND, type RoomView, type Seat } from "@/game/engine";
import { Lobby } from "./lobby";
import { ReactionBar, useFloaters } from "./reactions";
import { ResultView } from "./result";
import { Reveal } from "./reveal";
import { RoundInput } from "./round-input";

const OFFLINE_END_AFTER_MS = 2 * 60 * 1000;

export function Game({ initial, origin }: { initial: RoomView; origin: string }) {
  const { spawn, overlay } = useFloaters();
  const { view, connection, presence, error, send, post, react, refresh } = useRoom(initial, spawn);
  useResultRetry(view, refresh);
  const [busy, setBusy] = useState(false);
  const partnerOnline = presence?.online ?? true;
  const now = useNow(!!presence && !presence.online);
  const offlineFor = presence && !presence.online && view.players.guest ? now - presence.since : 0;

  const seat = view.seat;
  const partnerSeat: Seat = seat === "host" ? "guest" : "host";
  const names = { host: view.players.host.name, guest: view.players.guest?.name ?? "your partner" };
  const partnerName = names[partnerSeat];
  const progress = view.progress;
  const round = view.round;
  const subject = round?.format === "mind" ? names[round.subject] : partnerName;
  const t = (copy: Copy) => say(copy, view.mode, { p: partnerName, s: subject });

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  let content: React.ReactNode;
  if (progress.phase === "lobby") {
    const deck = getDeck(view.deckId);
    content = (
      <Lobby
        view={view}
        link={`${origin}/play/${view.code}`}
        intro={deck ? t(deck.intro) : ""}
        busy={busy}
        onReady={() => act(() => send({ round: LOBBY_ROUND, attempt: 0, kind: "ready" }))}
        onKick={() => act(() => post("kick"))}
      />
    );
  } else if ((progress.phase === "answer" || progress.phase === "reveal") && round) {
    const header = (
      <header className="flex flex-col gap-1">
        <p className="text-sm opacity-60">
          {progress.step}/{view.totalSteps} · {round.scene.time}
        </p>
        <p className="text-lg">{t(round.scene.title)}</p>
      </header>
    );
    if (progress.phase === "answer") {
      content = (
        <>
          {header}
          {view.tries.length > 0 && (
            <p className="text-sm">
              Try {progress.attempt + 1}. Last time:{" "}
              {view.tries.map((tr, i) => (
                <span key={i}>
                  {names.host} said “{optionLabel(round, tr.host.picks?.[0], t)}”, {names.guest} said “
                  {optionLabel(round, tr.guest.picks?.[0], t)}”.{" "}
                </span>
              ))}
            </p>
          )}
          {view.mine.answer ? (
            <p>Locked in. {view.partner.answered ? "" : `Waiting for ${partnerName}…`}</p>
          ) : (
            <RoundInput
              key={`${progress.round}-${progress.attempt}`}
              round={round}
              seat={seat}
              partnerName={partnerName}
              t={t}
              busy={busy}
              onSubmit={(payload) =>
                act(() => send({ round: progress.round, attempt: progress.attempt, kind: "answer", payload }))
              }
            />
          )}
        </>
      );
    } else {
      content = (
        <>
          {header}
          {view.reveal && <Reveal round={round} reveal={view.reveal} names={names} t={t} />}
          {view.mine.ready ? (
            <p>Waiting for {partnerName}…</p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => act(() => send({ round: progress.round, attempt: 0, kind: "ready" }))}
              className="rounded bg-black px-4 py-3 text-white disabled:opacity-40"
            >
              Next
            </button>
          )}
        </>
      );
    }
  } else if (progress.phase === "done") {
    content = view.result ? (
      <ResultView result={view.result} view={view} names={names} t={t} />
    ) : (
      <p className="text-xl">That&apos;s the day. Working out your duo type…</p>
    );
  } else {
    content = (
      <div className="flex flex-col gap-3">
        <p className="text-xl">This game was ended.</p>
        <Link href="/" className="underline">
          Start a new game
        </Link>
      </div>
    );
  }

  const live = progress.phase !== "done" && progress.phase !== "ended";
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 pt-6 pb-24">
      {overlay}
      {live && view.players.guest && <ReactionBar onReact={react} />}
      <StatusBar
        names={names}
        seat={seat}
        partnerOnline={partnerOnline}
        partnerAnswered={progress.phase === "answer" && view.partner.answered}
        connection={connection}
      />
      {content}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {live && view.players.guest && offlineFor >= OFFLINE_END_AFTER_MS && (
        <div className="flex flex-col gap-2 rounded border p-3">
          <p>{partnerName} has been offline for a while. They can rejoin with the same link.</p>
          <button type="button" className="rounded border px-3 py-2" onClick={() => act(() => post("end"))}>
            End game
          </button>
        </div>
      )}
    </main>
  );
}

function optionLabel(round: NonNullable<RoomView["round"]>, i: number | null | undefined, t: (c: Copy) => string) {
  return "options" in round && i != null ? t(round.options[i]!.label) : "?";
}

function StatusBar({
  names,
  seat,
  partnerOnline,
  partnerAnswered,
  connection,
}: {
  names: { host: string; guest: string };
  seat: Seat;
  partnerOnline: boolean;
  partnerAnswered: boolean;
  connection: string;
}) {
  const partner = seat === "host" ? names.guest : names.host;
  return (
    <div className="flex items-center justify-between text-sm" aria-live="polite">
      <span>
        {partner}: {partnerOnline ? (partnerAnswered ? "locked in" : "here") : "offline"}
      </span>
      {connection === "polling" && <span className="opacity-60">reconnecting…</span>}
    </div>
  );
}

/** If the game is done but unscored (scoring failed or raced), ask again a few times. */
function useResultRetry(view: RoomView, refresh: () => Promise<void>) {
  const missing = view.progress.phase === "done" && !view.result;
  useEffect(() => {
    if (!missing) return;
    let tries = 0;
    const id = setInterval(() => {
      if (++tries > 5) clearInterval(id);
      else void refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [missing, refresh]);
}

/** A clock that ticks every 10s while `active`, for "offline for 2 minutes" checks. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
