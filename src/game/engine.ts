import { samePicks, type Answer } from "./answers";
import type { Deck, Round } from "./deck";
import type { ReactionTally } from "./reactions";

export type Seat = "host" | "guest";
export type Mode = "couple" | "friends";
export type MoveKind = "ready" | "answer";

export type MoveRow = {
  playerId: string;
  round: number;
  attempt: number;
  kind: MoveKind;
  /** Answers for `answer` moves; reaction counts for `ready` moves. */
  payload: Answer & { reactions?: ReactionTally };
};

export type TextSlot = "self" | "partner" | "shared";
export type TextRow = {
  playerId: string;
  round: number;
  slot: TextSlot;
  body: string;
  matchPct: number | null;
};

/** A text as a client sees it: by seat, never by user id. */
export type ViewText = { seat: Seat; slot: TextSlot; body: string; matchPct: number | null };

export type RoomFacts = {
  hostId: string;
  guestId: string | null;
  endedAt: Date | string | null;
};

/** `step` is 1-based among rounds actually played (branches skip rounds). */
export type Progress =
  | { phase: "lobby" }
  | { phase: "answer"; round: number; attempt: number; step: number }
  | { phase: "reveal"; round: number; attempt: number; step: number }
  | { phase: "done" }
  | { phase: "ended" };

export const LOBBY_ROUND = -1;

type MoveKey = Pick<MoveRow, "playerId" | "round" | "attempt" | "kind">;
const keyOf = (m: MoveKey) => `${m.playerId}|${m.round}|${m.attempt}|${m.kind}`;

function indexMoves(moves: MoveRow[]) {
  const byKey = new Map(moves.map((m) => [keyOf(m), m]));
  return (playerId: string, round: number, attempt: number, kind: MoveKind) =>
    byKey.get(keyOf({ playerId, round, attempt, kind }));
}

/** Progress is never stored: it is recomputed from the move log on every read and write. */
export function derive(deck: Deck, room: RoomFacts, moves: MoveRow[]): Progress {
  if (room.endedAt) return { phase: "ended" };
  const { hostId, guestId } = room;
  if (!guestId) return { phase: "lobby" };

  const get = indexMoves(moves);
  const both = (round: number, attempt: number, kind: MoveKind) =>
    !!get(hostId, round, attempt, kind) && !!get(guestId, round, attempt, kind);

  if (!both(LOBBY_ROUND, 0, "ready")) return { phase: "lobby" };

  const matchedById = new Map<string, boolean>();
  let step = 0;
  for (let r = 0; r < deck.rounds.length; r++) {
    const round = deck.rounds[r]!;
    if (round.ifPrev && matchedById.get(round.ifPrev.round) !== (round.ifPrev.is === "matched")) {
      continue;
    }
    step++;
    let attempt = 0;
    for (;;) {
      if (!both(r, attempt, "answer")) return { phase: "answer", round: r, attempt, step };
      const matched = samePicks(
        get(hostId, r, attempt, "answer")?.payload,
        get(guestId, r, attempt, "answer")?.payload
      );
      if (round.format === "agree" && !matched && attempt + 1 < round.tries) {
        attempt++;
        continue;
      }
      matchedById.set(round.id, matched);
      break;
    }
    if (!both(r, 0, "ready")) return { phase: "reveal", round: r, attempt, step };
  }
  return { phase: "done" };
}

/** Rounds a pair will play: branch alternatives (same `ifPrev.round`) count once. */
export function plannedLength(deck: Deck): number {
  const branches = new Set(deck.rounds.flatMap((r) => (r.ifPrev ? [r.ifPrev.round] : [])));
  return deck.rounds.filter((r) => !r.ifPrev).length + branches.size;
}

export type MoveCheck = "ok" | "duplicate" | "not-player" | "stale";

/** Cheap, pure admission check; the server repeats it under the room lock before inserting. */
export function checkMove(
  deck: Deck,
  room: RoomFacts,
  moves: MoveRow[],
  move: MoveKey
): MoveCheck {
  if (move.playerId !== room.hostId && move.playerId !== room.guestId) return "not-player";
  if (indexMoves(moves)(move.playerId, move.round, move.attempt, move.kind)) return "duplicate";

  const progress = derive(deck, room, moves);
  if (move.kind === "ready") {
    if (move.attempt !== 0) return "stale";
    if (progress.phase === "lobby") return room.guestId && move.round === LOBBY_ROUND ? "ok" : "stale";
    return progress.phase === "reveal" && move.round === progress.round ? "ok" : "stale";
  }
  return progress.phase === "answer" &&
    move.round === progress.round &&
    move.attempt === progress.attempt
    ? "ok"
    : "stale";
}

export type PlayerInfo = { name: string; avatarUrl: string | null };
export type Pair<T> = { host: T; guest: T };

export type RoomView = {
  version: number;
  roomId: string;
  code: string;
  mode: Mode;
  deckId: string;
  seat: Seat;
  players: { host: PlayerInfo; guest: PlayerInfo | null };
  progress: Progress;
  totalSteps: number;
  /** Content of the current round, so a client on an older build renders the server's text. */
  round: Round | null;
  mine: { answer: Answer | null; texts: ViewText[]; ready: boolean };
  partner: { answered: boolean; ready: boolean };
  /** Must Agree: earlier attempts of the current round, shown to both by design. */
  tries: Pair<Answer>[];
  reveal: (Pair<Answer> & { texts: ViewText[] }) | null;
};

export type ViewInput = {
  deck: Deck;
  room: RoomFacts & { id: string; code: string; mode: Mode; deckId: string; seq: number };
  moves: MoveRow[];
  texts: TextRow[];
  players: RoomView["players"];
  viewerId: string;
};

/** True when this player has acted and only the partner can move the game forward. */
export function waitingOnPartner(view: RoomView): boolean {
  switch (view.progress.phase) {
    case "lobby":
      return !view.players.guest || (view.mine.ready && !view.partner.ready);
    case "answer":
      return !!view.mine.answer && !view.partner.answered;
    case "reveal":
      return view.mine.ready && !view.partner.ready;
    default:
      return false;
  }
}

/** The sanitized view for one player. The partner's answer appears only once both are in. */
export function viewFor({ deck, room, moves, texts, players, viewerId }: ViewInput): RoomView {
  const seat: Seat = viewerId === room.hostId ? "host" : "guest";
  const partnerId = seat === "host" ? room.guestId : room.hostId;
  const progress = derive(deck, room, moves);
  const get = indexMoves(moves);

  const view: RoomView = {
    version: room.seq,
    roomId: room.id,
    code: room.code,
    mode: room.mode,
    deckId: room.deckId,
    seat,
    players,
    progress,
    totalSteps: plannedLength(deck),
    round: null,
    mine: { answer: null, texts: [], ready: false },
    partner: { answered: false, ready: false },
    tries: [],
    reveal: null,
  };

  if (progress.phase === "lobby") {
    view.mine.ready = !!get(viewerId, LOBBY_ROUND, 0, "ready");
    view.partner.ready = !!partnerId && !!get(partnerId, LOBBY_ROUND, 0, "ready");
    return view;
  }
  if (progress.phase !== "answer" && progress.phase !== "reveal") return view;
  if (!partnerId || !room.guestId) return view;

  const { round: r, attempt } = progress;
  const answerOf = (playerId: string, a: number) => get(playerId, r, a, "answer")?.payload;
  const roundTexts: ViewText[] = texts
    .filter((t) => t.round === r)
    .map(({ playerId, slot, body, matchPct }) => ({
      seat: playerId === room.hostId ? "host" : "guest",
      slot,
      body,
      matchPct,
    }));

  view.round = deck.rounds[r] ?? null;
  view.mine.answer = answerOf(viewerId, attempt) ?? null;
  view.mine.texts = roundTexts.filter((t) => t.seat === seat);
  view.partner.answered = !!answerOf(partnerId, attempt);
  view.tries = Array.from({ length: attempt }, (_, a) => ({
    host: answerOf(room.hostId, a) ?? {},
    guest: answerOf(room.guestId!, a) ?? {},
  }));

  if (progress.phase === "reveal") {
    view.mine.ready = !!get(viewerId, r, 0, "ready");
    view.partner.ready = !!get(partnerId, r, 0, "ready");
    view.reveal = {
      host: answerOf(room.hostId, attempt) ?? {},
      guest: answerOf(room.guestId, attempt) ?? {},
      texts: roundTexts,
    };
  }
  return view;
}
