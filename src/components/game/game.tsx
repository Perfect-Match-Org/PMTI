"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoom, type Connection } from "@/client/useRoom";
import { say } from "@/game/copy";
import type { Copy } from "@/game/deck";
import type { PlayerInfo, RoomView, Seat } from "@/game/engine";
import { Avatar } from "@/components/ui/avatar";
import { ActionBar } from "./action-bar";
import { Lobby } from "./lobby";
import { useReactionLayer } from "./reactions";
import { ResultView } from "./result";
import { Reveal } from "./reveal";
import { RoomProvider, type RoomContextValue } from "./room-context";
import { RoundInput } from "./round-input";

const OFFLINE_END_AFTER_MS = 2 * 60 * 1000;

export function Game({ initial, origin }: { initial: RoomView; origin: string }) {
  const router = useRouter();
  const { spawn, overlay } = useReactionLayer();
  const { view, connection, presence, error, send, post, react, refresh } = useRoom(initial, spawn);
  useResultRetry(view, refresh);
  const [busy, setBusy] = useState(false);
  const now = useNow(!!presence && !presence.online);
  const offlineFor = presence && !presence.online && view.players.guest ? now - presence.since : 0;

  const seat = view.seat;
  const partnerSeat: Seat = seat === "host" ? "guest" : "host";
  const names = { host: view.players.host.name, guest: view.players.guest?.name ?? "your partner" };
  const round = view.round;
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
  const ctx: RoomContextValue = { view, seat, partnerSeat, names, t, busy, act, send, post, react };

  const progress = view.progress;
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
  } else if (progress.phase === "done") {
    key = "done";
    screen = view.result ? (
      <ResultView result={view.result} />
    ) : (
      <p className="pt-10 text-3xl font-extrabold">Working out your duo type…</p>
    );
  } else {
    key = "ended";
    screen = (
      <>
        <h1 className="pt-10 text-4xl leading-tight font-extrabold">This game was ended.</h1>
        <p className="mt-3 text-lg text-muted">Start a new one whenever you’re both ready.</p>
        <ActionBar reactions={false} primary={{ label: "Start a new game", onClick: () => router.push("/") }} />
      </>
    );
  }

  const inRound = progress.phase === "answer" || progress.phase === "reveal";
  const partner = view.players[partnerSeat];
  return (
    <MotionConfig reducedMotion="user">
      <RoomProvider value={ctx}>
        <main className="min-h-dvh overflow-x-clip bg-white">
          {overlay(partner)}
          <div className="mx-auto flex max-w-md flex-col px-5 pt-4 pb-44 md:pt-8">
            {inRound && <Segments step={progress.step} total={view.totalSteps} />}
            {partner && (progress.phase === "answer" || presence?.online === false) && progress.phase !== "done" && (
              <LiveLine
                partner={partner}
                online={presence?.online ?? true}
                lockedIn={progress.phase === "answer" && view.partner.answered}
                choosing={progress.phase === "answer" && !view.partner.answered}
                connection={connection}
              />
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 font-semibold text-red-deep">
                {error}
              </p>
            )}
            {partner && progress.phase !== "done" && progress.phase !== "ended" && offlineFor >= OFFLINE_END_AFTER_MS && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-tile px-4 py-3">
                <p className="font-medium">{partner.name} has been offline a while. They can rejoin with the same link.</p>
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

/** Story-style progress: one segment per round, the current one fills in red. */
function Segments({ step, total }: { step: number; total: number }) {
  return (
    <div role="img" aria-label={`Round ${step} of ${total}`} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="h-1 overflow-hidden rounded-full bg-line">
          {i + 1 < step && <span className="block h-full bg-navy" />}
          {i + 1 === step && (
            <motion.span
              className="block h-full origin-left bg-red"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </span>
      ))}
    </div>
  );
}

function LiveLine(props: { partner: PlayerInfo; online: boolean; lockedIn: boolean; choosing: boolean; connection: Connection }) {
  const { partner, online, lockedIn, choosing, connection } = props;
  const state = !online ? "offline" : lockedIn ? "locked" : choosing ? "choosing" : "here";
  return (
    <div className="mt-3 flex min-h-8 items-center gap-2.5 text-[0.95rem]" aria-live="polite">
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
              <span aria-hidden className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <i key={i} className="typing-dot block size-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
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
