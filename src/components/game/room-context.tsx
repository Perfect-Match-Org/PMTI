"use client";

import { createContext, useContext } from "react";
import type { Move } from "@/client/useRoom";
import type { Copy, Deck } from "@/game/deck";
import type { Pair, RoomView, Seat } from "@/game/engine";
import type { Reaction } from "@/game/reactions";

export type RoomContextValue = {
  view: RoomView;
  /** This build's copy of the room's deck; the game only renders when it has one. */
  deck: Deck;
  seat: Seat;
  partnerSeat: Seat;
  names: Pair<string>;
  t: (copy: Copy) => string;
  busy: boolean;
  /** Runs an action with the busy flag set, so buttons can't double-fire. */
  act: (fn: () => Promise<void>) => Promise<void>;
  send: (move: Move) => Promise<void>;
  post: (path: string, body?: unknown, options?: { showConflict?: boolean }) => Promise<void>;
  react: (emoji: Reaction) => void;
};

const RoomContext = createContext<RoomContextValue | null>(null);
export const RoomProvider = RoomContext.Provider;

export function useRoomContext(): RoomContextValue {
  const value = useContext(RoomContext);
  if (!value) throw new Error("useRoomContext must be used inside <RoomProvider>");
  return value;
}
