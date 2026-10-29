"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoom, type Connection } from "@/client/useRoom";
import { say } from "@/game/copy";
import { getDeck } from "@/game/decks";
import type { Copy } from "@/game/deck";
import { other, waitingOnPartner, type PlayerInfo, type RoomView } from "@/game/engine";
import { Avatar } from "@/components/ui/avatar";
import { NavyHeadline, NavyPage } from "@/components/ui/navy-page";
import { ErrorNote } from "@/components/ui/error-note";
import { Segments } from "@/components/ui/segments";
import { TypingDots } from "@/components/ui/typing-dots";
import { ActionBar } from "./action-bar";
import { GameClosed } from "./game-closed";
import { Lobby } from "./lobby";
import { useReactionLayer } from "./reactions";
import { ResultView } from "./result";
import { Reveal } from "./reveal";
import { RoomProvider, type RoomContextValue } from "./room-context";
import { RoundInput } from "./round-input";
import { Stage } from "./stage";

/** How long we wait on a partner with nothing changing before offering to end the game. */
const STALL_MS = 2 * 60 * 1000;

export function Game({ initial, origin }: { initial: RoomView; origin: string }) {
  const router = useRouter();
  const { spawn, overlay } = useReactionLayer();
  const { view, connection, presence, error, gone, changedAt, send, post, react, refresh } = useRoom(initial, spawn);
  const unscored = useResultRetry(view, refresh);
  const [busy, setBusy] = useState(false);
  // Measured from the last change, not from presence: presence can't see a partner whose realtime is down.
  const waiting = waitingOnPartner(view);
  const now = useNow(waiting);
  const stalled = waiting && now - changedAt >= STALL_MS;

  const seat = view.seat;
  const partnerSeat = other(seat);
  const deck = getDeck(view.deckId);
  const names = { host: view.players.host.name, guest: view.players.guest?.name ?? "your partner" };
  const round = deck && (view.progress.phase === "answer" || view.progress.phase === "reveal") ? deck.rounds[view.progress.round] : undefined;
  const subject = round?.format === "mind" ? names[round.subject] : names[partnerSeat];
  const t = (copy: Copy) => say(copy, view.mode, { p: names[partnerSeat], s: subject });
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  if (!deck) return <NewVersion />;
  const ctx: RoomContextValue = { view, deck, seat, partnerSeat, names, t, busy, act, send, post, react };

  const progress = view.progress;
  if (gone) {
    return (
      <GameClosed message={gone.message}>
        {gone.signedOut && (
          // The page itself shows the sign-in when signed out, and brings you back here after.
          <button type="button" className="btn btn-secondary self-start" onClick={() => window.location.reload()}>
            Sign in again
          </button>
        )}
      </GameClosed>
    );
  }
  if (progress.phase === "ended") return <GameClosed message="This game was ended." />;

  let key: string;
  let screen: React.ReactNode;
  if (progress.phase === "lobby") {
    key = "lobby";
    screen = <Lobby link={`${origin}/play/${view.code}`} />;
  } else if (progress.phase === "answer" && round) {
    key = `answer-${progress.round}-${progress.attempt}`;
    screen = <RoundInput key={key} round={round} />;
  } else if (progress.phase === "reveal" && round && view.reveal) {
    key = `reveal-${progress.round}`;
    screen = <Reveal key={key} round={round} reveal={view.reveal} />;
  } else {
    key = "done";
    screen = view.result ? (
      <ResultView result={view.result} />
    ) : unscored.gaveUp ? (
      <Stage
        aside={
          <>
            <h1 className="text-4xl leading-tight font-extrabold lg:text-5xl">Couldn’t work out your duo type.</h1>
            <p className="mt-3 text-lg text-muted">Your answers are saved. Try again in a moment.</p>
            <ActionBar
              reactions={false}
              secondary={{ label: "Start a new game", onClick: () => router.push("/") }}
              primary={{ label: "Try again", onClick: unscored.retry }}
            />
          </>
        }
      />
    ) : (
      <Stage aside={<p className="text-3xl font-extrabold">Working out your duo type…</p>} />
    );
  }

  const inRound = progress.phase === "answer" || progress.phase === "reveal";
  const partner = view.players[partnerSeat];
  const showLive = (progress.phase === "answer" || presence?.online === false) && progress.phase !== "done";
  return (
    <MotionConfig reducedMotion="user">
      <RoomProvider value={ctx}>
        <main className="min-h-dvh overflow-x-clip bg-white">
          {overlay(partner)}
          <div className="frame flex flex-col pt-4 pb-44 md:pt-8 lg:pt-6 lg:pb-36">
            {/* Mounted in every phase so the desktop row never reflows between lobby, rounds and result. */}
            <header className="flex flex-col lg:min-h-8 lg:flex-row lg:items-center lg:gap-10">
              <Link href="/" className="hidden text-xl font-black text-navy lg:block">
                PMTI
              </Link>
              <div className="lg:flex-1">{inRound && <Segments step={progress.step} total={view.totalSteps} />}</div>
              <div className="lg:flex lg:w-72 lg:justify-end">
                {showLive && partner && (
                  <LiveLine
                    partner={partner}
                    online={presence?.online ?? true}
                    lockedIn={progress.phase === "answer" && view.partner.answered}
                    choosing={progress.phase === "answer" && !view.partner.answered}
                    connection={connection}
                  />
                )}
              </div>
            </header>
            {error && (
              <ErrorNote on="white" className="mt-4">
                {error}
              </ErrorNote>
            )}
            {partner && stalled && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-tile px-4 py-3">
                <p className="font-medium">
                  {presence?.online === false
                    ? `${partner.name} is offline. They can rejoin with the same link.`
                    : `Still waiting on ${partner.name}.`}
                </p>
                <button type="button" className="font-bold text-navy underline" onClick={() => act(() => post("end"))}>
                  End game
                </button>
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              >
                {screen}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </RoomProvider>
    </MotionConfig>
  );
}

/**
 * This tab is running an older build than the game it's showing (a new deck shipped since it loaded).
 * Reloading picks up the new build; the game itself is saved on the server.
 */
function NewVersion() {
  return (
    <NavyPage>
      <NavyHeadline>PMTI has a new version.</NavyHeadline>
      <p className="text-xl text-white/80">Reload to keep playing. Your game is saved.</p>
      <button type="button" onClick={() => window.location.reload()} className="btn btn-pink self-start">
        Reload
      </button>
    </NavyPage>
  );
}

/** The partner's status beside the round bar: here, choosing, locked in, or offline. */
function LiveLine(props: { partner: PlayerInfo; online: boolean; lockedIn: boolean; choosing: boolean; connection: Connection }) {
  const { partner, online, lockedIn, choosing, connection } = props;
  const state = !online ? "offline" : lockedIn ? "locked" : choosing ? "choosing" : "here";
  return (
    <div className="mt-3 flex min-h-8 items-center gap-2.5 text-[0.95rem] lg:mt-0" aria-live="polite">
      <Avatar player={partner} tone="partner" size={28} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-1.5 text-muted"
        >
          {state === "locked" ? (
            <span className="font-bold text-red">{partner.name} locked in</span>
          ) : state === "offline" ? (
            <span>{partner.name} is offline</span>
          ) : state === "choosing" ? (
            <>
              <span>
                <b className="font-bold text-ink">{partner.name}</b> is choosing
              </span>
              <TypingDots className="gap-0.5" />
            </>
          ) : (
            <span>
              <b className="font-bold text-ink">{partner.name}</b> is here
            </span>
          )}
        </motion.span>
      </AnimatePresence>
      {connection === "polling" && <span className="ml-auto text-sm text-muted">reconnecting…</span>}
    </div>
  );
}

/**
 * If the game is done but unscored (scoring failed or raced), ask again a few times, then say so
 * and leave a Try again button rather than a spinner that never ends.
 */
function useResultRetry(view: RoomView, refresh: () => Promise<void>) {
  const missing = view.progress.phase === "done" && !view.result;
  const [attempt, setAttempt] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (!missing) return;
    let tries = 0;
    const id = setInterval(() => {
      if (++tries <= 5) return void refresh();
      clearInterval(id);
      setGaveUp(true);
    }, 2000);
    return () => clearInterval(id);
  }, [missing, refresh, attempt]);
  const retry = () => {
    setGaveUp(false);
    setAttempt((a) => a + 1);
    void refresh();
  };
  return { gaveUp: missing && gaveUp, retry };
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
