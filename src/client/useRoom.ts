"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Answer } from "@/game/answers";
import { LOBBY_ROUND, other, waitingOnPartner, type MoveKind, type RoomView } from "@/game/engine";
import { REACTIONS, type Reaction, type ReactionTally } from "@/game/reactions";
import { supabaseBrowser } from "./supabase";

const POLL_MS = 5000;
const NETWORK_ERROR = "Couldn’t reach the server. Check your connection and try again.";
/** Answers that mean this game is over for us: removed (403), gone (404), or a version that no longer exists (410). */
const GONE = new Set([403, 404, 410]);
const REACTION_FLUSH_MS = 250;
const MAX_BURST = 12;

export type Connection = "connecting" | "live" | "polling";
export type Move = { round: number; attempt: number; kind: MoveKind; payload?: Answer };
export type ReactionBurst = { emoji: Reaction; n: number; mine: boolean };

/**
 * Keeps one player's view in sync. The server is the only source of truth; every trigger
 * (realtime ping, reconnect, tab focus, poll) runs the same fetch. Polling runs whenever we're
 * waiting on the partner, even if the channel claims to be live, because pings can be dropped.
 */
export function useRoom(initial: RoomView, onReaction?: (burst: ReactionBurst) => void) {
  const [view, setView] = useState(initial);
  const [connection, setConnection] = useState<Connection>("connecting");
  /** Null until the first presence sync, so the UI doesn't flash "offline" on load. */
  const [presence, setPresence] = useState<{ online: boolean; since: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Set when the server says this game is over for us; the screen then offers a way out. */
  const [gone, setGone] = useState<string | null>(null);
  const goneRef = useRef(false);
  const markGone = useCallback((message: string) => {
    goneRef.current = true;
    setGone(message);
  }, []);
  /** When the game last moved, so a stall shows however the partner is connected. */
  const [changedAt, setChangedAt] = useState(() => Date.now());
  const version = useRef(initial.version);
  const { code, roomId, seat } = initial;
  const partnerSeat = other(seat);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const viewRef = useRef(view);
  const onReactionRef = useRef(onReaction);
  useEffect(() => {
    viewRef.current = view;
    onReactionRef.current = onReaction;
  });

  const accept = useCallback((next: RoomView) => {
    if (next.version < version.current) return;
    if (next.version > version.current) setChangedAt(Date.now());
    version.current = next.version;
    setView(next);
  }, []);

  const refresh = useCallback(async () => {
    if (goneRef.current) return;
    // A failed fetch is left to the next poll or ping.
    const res = await fetch(`/api/rooms/${code}`, { cache: "no-store" }).catch(() => null);
    if (res?.ok) accept(await res.json());
    else if (res && GONE.has(res.status)) markGone((await res.json().catch(() => ({}))).error ?? "This game is no longer available.");
  }, [code, accept, markGone]);

  /** `showConflict`: say what changed on a 409 instead of quietly catching up (most moves just catch up). */
  const post = useCallback(
    async (path: string, body?: unknown, { showConflict = false } = {}) => {
      setError(null);
      const res = await fetch(`/api/rooms/${code}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }).catch(() => null);
      if (!res) return setError(NETWORK_ERROR);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data && typeof data.version === "number") accept(data);
        else await refresh();
      } else if (res.status === 409) {
        if (showConflict) setError(data.error ?? "Something changed. Try again.");
        await refresh();
      } else if (GONE.has(res.status)) {
        markGone(data.error ?? "This game is no longer available.");
      } else {
        setError(data.error ?? "Something went wrong. Try again.");
      }
    },
    [code, accept, refresh, markGone]
  );

  // Reactions: batched into one broadcast per emoji every 250ms, and tallied per round so the
  // counts ride along on the next `ready` move (no extra writes). Taps made after you're ready,
  // while you wait, go with your next one; only those after the last round's are never sent.
  const pending = useRef<ReactionTally>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tallies = useRef(new Map<number, ReactionTally>());

  const react = useCallback((emoji: Reaction) => {
    const p = viewRef.current.progress;
    const round = p.phase === "lobby" ? LOBBY_ROUND : p.phase === "answer" || p.phase === "reveal" ? p.round : null;
    if (round === null) return;
    const tally = tallies.current.get(round) ?? {};
    tally[emoji] = (tally[emoji] ?? 0) + 1;
    tallies.current.set(round, tally);
    pending.current[emoji] = (pending.current[emoji] ?? 0) + 1;
    onReactionRef.current?.({ emoji, n: 1, mine: true });
    flushTimer.current ??= setTimeout(() => {
      flushTimer.current = null;
      const batch = pending.current;
      pending.current = {};
      for (const [e, n] of Object.entries(batch)) {
        void channelRef.current?.send({ type: "broadcast", event: "react", payload: { emoji: e, n } });
      }
    }, REACTION_FLUSH_MS);
  }, []);

  const send = useCallback(
    (move: Move) => {
      if (move.kind !== "ready") return post("moves", move);
      const reactions = Object.fromEntries(tallies.current);
      tallies.current.clear();
      return post("moves", Object.keys(reactions).length ? { ...move, payload: { reactions } } : move);
    },
    [post]
  );

  useEffect(() => {
    if (gone) return;
    const supabase = supabaseBrowser();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    void (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      const ch = supabase.channel(`room:${roomId}`, {
        config: { private: true, presence: { key: seat } },
      });
      channel = ch;
      channelRef.current = ch;
      ch.on("broadcast", { event: "sync" }, ({ payload }) => {
        if (typeof payload?.v !== "number" || payload.v > version.current) void refresh();
      })
        .on("broadcast", { event: "react" }, ({ payload }) => {
          const emoji = REACTIONS.find((r) => r === payload?.emoji);
          const n = Number(payload?.n);
          if (emoji && Number.isInteger(n) && n > 0) {
            onReactionRef.current?.({ emoji, n: Math.min(n, MAX_BURST), mine: false });
          }
        })
        .on("presence", { event: "sync" }, () => {
          const online = partnerSeat in ch.presenceState();
          setPresence((prev) => (prev?.online === online ? prev : { online, since: Date.now() }));
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnection("live");
            void ch.track({ since: Date.now() });
            void refresh();
          } else if (status !== "CLOSED" || !cancelled) {
            console.warn(`[room] realtime ${status}; falling back to polling`);
            setConnection("polling");
          }
        });
    })();

    return () => {
      cancelled = true;
      channelRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roomId, seat, partnerSeat, refresh, gone]);

  const waiting = waitingOnPartner(view);
  useEffect(() => {
    if (gone || (connection === "live" && !waiting)) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [connection, waiting, refresh, gone]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { view, connection, presence, error, gone, changedAt, send, post, refresh, react };
}
