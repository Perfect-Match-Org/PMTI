"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Answer } from "@/game/answers";
import { waitingOnPartner, type MoveKind, type RoomView } from "@/game/engine";
import { supabaseBrowser } from "./supabase";

const POLL_MS = 5000;

export type Connection = "connecting" | "live" | "polling";
export type Move = { round: number; attempt: number; kind: MoveKind; payload?: Answer };

/**
 * Keeps one player's view in sync. The server is the only source of truth; every trigger
 * (realtime ping, reconnect, tab focus, poll) runs the same fetch. Polling runs whenever we're
 * waiting on the partner, even if the channel claims to be live, because pings can be dropped.
 */
export function useRoom(initial: RoomView) {
  const [view, setView] = useState(initial);
  const [connection, setConnection] = useState<Connection>("connecting");
  /** Null until the first presence sync, so the UI doesn't flash "offline" on load. */
  const [presence, setPresence] = useState<{ online: boolean; since: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(initial.version);
  const { code, roomId, seat } = initial;
  const partnerSeat = seat === "host" ? "guest" : "host";

  const accept = useCallback((next: RoomView) => {
    if (next.version < version.current) return;
    version.current = next.version;
    setView(next);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
    if (res.ok) accept(await res.json());
  }, [code, accept]);

  const post = useCallback(
    async (path: string, body?: unknown) => {
      setError(null);
      const res = await fetch(`/api/rooms/${code}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data && typeof data.version === "number") accept(data);
        else await refresh();
      } else if (res.status === 409) {
        await refresh();
      } else {
        setError(data.error ?? "Something went wrong. Try again.");
      }
    },
    [code, accept, refresh]
  );

  const send = useCallback((move: Move) => post("moves", move), [post]);

  useEffect(() => {
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
      ch.on("broadcast", { event: "sync" }, ({ payload }) => {
        if (typeof payload?.v !== "number" || payload.v > version.current) void refresh();
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
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roomId, seat, partnerSeat, refresh]);

  const waiting = waitingOnPartner(view);
  useEffect(() => {
    if (connection === "live" && !waiting) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [connection, waiting, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { view, connection, presence, error, send, post, refresh };
}
