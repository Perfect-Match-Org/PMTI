import type { Answer } from "./answers";
import type { Deck, Round } from "./deck";
import { derive, LOBBY_ROUND, type MoveRow, type RoomFacts, type Seat, type TextRow } from "./engine";
import type { ReactionTally } from "./reactions";

export const ROOM: RoomFacts & { guestId: string } = { hostId: "host-id", guestId: "guest-id", endedAt: null };
const idOf = (seat: Seat) => (seat === "host" ? ROOM.hostId : ROOM.guestId);

export type Script = {
  answer: (seat: Seat, round: Round, index: number, attempt: number) => Answer;
  /** Free-text rounds: the match percentage the server would have stored per (seat, slot). */
  matchPct?: (seat: Seat, round: Round, slot: TextRow["slot"]) => number | null;
  reactions?: (seat: Seat, index: number) => ReactionTally | undefined;
};

/** Plays a whole game through the real engine, so tests score realistic move logs. */
export function play(deck: Deck, script: Script): { moves: MoveRow[]; texts: TextRow[] } {
  const moves: MoveRow[] = [];
  const texts: TextRow[] = [];
  const seats: Seat[] = ["host", "guest"];
  for (const seat of seats) {
    moves.push({ playerId: idOf(seat), round: LOBBY_ROUND, attempt: 0, kind: "ready", payload: {} });
  }
  for (let guard = 0; guard < 500; guard++) {
    const p = derive(deck, ROOM, moves);
    if (p.phase === "done") return { moves, texts };
    if (p.phase === "reveal") {
      for (const seat of seats) {
        const reactions = script.reactions?.(seat, p.round);
        moves.push({ playerId: idOf(seat), round: p.round, attempt: 0, kind: "ready", payload: reactions ? { reactions } : {} });
      }
      continue;
    }
    if (p.phase !== "answer") throw new Error(`unexpected phase ${p.phase}`);
    const round = deck.rounds[p.round]!;
    for (const seat of seats) {
      const answer = script.answer(seat, round, p.round, p.attempt);
      if (round.format === "write") {
        const slots: TextRow["slot"][] = round.variant === "mirror" ? ["self", "partner"] : ["shared"];
        slots.forEach((slot, i) =>
          texts.push({
            playerId: idOf(seat),
            round: p.round,
            slot,
            body: answer.texts?.[i] ?? "x",
            matchPct: script.matchPct?.(seat, round, slot) ?? null,
          })
        );
      }
      moves.push({
        playerId: idOf(seat),
        round: p.round,
        attempt: p.attempt,
        kind: "answer",
        payload: round.format === "write" ? {} : answer,
      });
    }
  }
  throw new Error("game did not finish");
}
