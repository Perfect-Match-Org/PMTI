"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoom, type Connection } from "@/client/useRoom";
import { say } from "@/game/copy";
import { phaseOf, splitTime, type DayPhase } from "@/game/day";
import type { Copy, Round } from "@/game/deck";
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

  let phase: DayPhase = "afternoon";
  let content: React.ReactNode;
  if (progress.phase === "lobby") {
    phase = "morning";
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
    phase = phaseOf(round.scene.time);
    const header = <SceneHeader round={round} t={t} />;
    if (progress.phase === "answer") {
      content = (
        <>
          {header}
          {view.tries.length > 0 && (
            <div className="card flex flex-col gap-1">
              <p className="font-semibold">Not the same. Try {progress.attempt + 1} of {"tries" in round ? round.tries : 3}.</p>
              {view.tries.map((tr, i) => (
                <p key={i} className="text-sm">
                  {names.host} picked “{optionLabel(round, tr.host.picks?.[0], t)}”, {names.guest} picked “
                  {optionLabel(round, tr.guest.picks?.[0], t)}”.
                </p>
              ))}
            </div>
          )}
          {view.mine.answer ? (
            <div className="card">
              <p className="font-display text-2xl">Locked in.</p>
              <p className="mt-1">{view.partner.answered ? "Revealing…" : `Waiting for ${partnerName}…`}</p>
            </div>
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
          {view.reveal && (
            <Reveal key={`${progress.round}-${progress.attempt}`} round={round} reveal={view.reveal} names={names} t={t} />
          )}
          {view.mine.ready ? (
            <p className="font-medium">Waiting for {partnerName} to move on…</p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => act(() => send({ round: progress.round, attempt: 0, kind: "ready" }))}
              className="btn self-start"
            >
              Next
            </button>
          )}
        </>
      );
    }
  } else if (progress.phase === "done") {
    phase = "night";
    content = view.result ? (
      <ResultView result={view.result} view={view} names={names} t={t} />
    ) : (
      <p className="font-display text-3xl">Working out your duo type…</p>
    );
  } else {
    content = (
      <div className="card flex flex-col items-start gap-4">
        <p className="font-display text-2xl">This game was ended.</p>
        <Link href="/" className="btn">
          Start a new game
        </Link>
      </div>
    );
  }

  const live = progress.phase !== "done" && progress.phase !== "ended";
  return (
    <main data-phase={phase} className="stage min-h-dvh">
      {overlay}
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-5 pb-28">
        <TopBar
          partnerName={partnerName}
          online={presence?.online ?? true}
          lockedIn={progress.phase === "answer" && view.partner.answered}
          joined={!!view.players.guest}
          connection={connection}
          step={progress.phase === "answer" || progress.phase === "reveal" ? progress.step : null}
          total={view.totalSteps}
        />
        {content}
        {error && (
          <p role="alert" className="card border-pm-red font-medium">
            {error}
          </p>
        )}
        {live && view.players.guest && offlineFor >= OFFLINE_END_AFTER_MS && (
          <div className="card flex flex-col items-start gap-3">
            <p>{partnerName} has been offline for a couple of minutes. They can rejoin with the same link.</p>
            <button type="button" className="btn" onClick={() => act(() => post("end"))}>
              End game
            </button>
          </div>
        )}
      </div>
      {live && view.players.guest && <ReactionBar onReact={react} />}
    </main>
  );
}

function SceneHeader({ round, t }: { round: Round; t: (copy: Copy) => string }) {
  const { clock, meridiem } = splitTime(round.scene.time);
  return (
    <header>
      <p className="font-display text-[clamp(4.5rem,24vw,7rem)] leading-[0.82] text-[var(--clock)]">
        {clock}
        <span className="ml-1 text-[0.32em]">{meridiem}</span>
      </p>
      <p className="mt-3 text-xl leading-snug font-medium">{t(round.scene.title)}</p>
    </header>
  );
}

function optionLabel(round: Round, i: number | null | undefined, t: (c: Copy) => string) {
  return "options" in round && i != null ? t(round.options[i]!.label) : "?";
}

function TopBar(props: {
  partnerName: string;
  online: boolean;
  lockedIn: boolean;
  joined: boolean;
  connection: Connection;
  step: number | null;
  total: number;
}) {
  const { partnerName, online, lockedIn, joined, connection, step, total } = props;
  const status = !joined ? null : !online ? `${partnerName} is offline` : lockedIn ? `${partnerName} locked in` : `${partnerName} is here`;
  return (
    <div className="flex min-h-6 items-center justify-between gap-3 text-sm font-medium">
      <span aria-live="polite" className="flex items-center gap-2">
        {status && (
          <>
            <span
              aria-hidden
              className={`size-2.5 rounded-full ${!online ? "bg-current opacity-30" : lockedIn ? "bg-pm-red" : "bg-current"}`}
            />
            {status}
          </>
        )}
        {connection === "polling" && <span className="opacity-70">(reconnecting)</span>}
      </span>
      {step !== null && (
        <span role="img" aria-label={`Round ${step} of ${total}`} className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full ${i + 1 === step ? "bg-[var(--clock)]" : i + 1 < step ? "bg-current" : "bg-current opacity-25"}`}
            />
          ))}
        </span>
      )}
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
