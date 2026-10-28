import { describe, expect, it } from "vitest";
import { answerSchema, type Answer } from "./answers";
import type { Deck, Round } from "./deck";
import { CURRENT_DECK } from "./decks";
import {
  checkMove,
  derive,
  LOBBY_ROUND,
  plannedLength,
  viewFor,
  type MoveKind,
  type MoveRow,
  type RoomFacts,
} from "./engine";

const HOST = "host-id";
const GUEST = "guest-id";
const opt = (label: string) => ({ label });
const scene = { time: "9am", title: "t" };

const deck: Deck = {
  id: "test@1",
  intro: "",
  rounds: [
    { id: "pick", scene, format: "pick", prompt: "", options: [opt("a"), opt("b")] },
    { id: "agree", scene, format: "agree", prompt: "", tries: 3, options: [opt("a"), opt("b")] },
    {
      id: "if-failed",
      scene,
      format: "write",
      variant: "shared",
      prompt: "",
      poolKey: "x",
      ifPrev: { round: "agree", is: "failed" },
    },
    {
      id: "if-matched",
      scene,
      format: "pick",
      prompt: "",
      options: [opt("a"), opt("b")],
      ifPrev: { round: "agree", is: "matched" },
    },
    { id: "last", scene, format: "pick", prompt: "", options: [opt("a"), opt("b")] },
  ],
};

const room: RoomFacts = { hostId: HOST, guestId: GUEST, endedAt: null };

function move(playerId: string, round: number, kind: MoveKind, payload: Answer = {}, attempt = 0): MoveRow {
  return { playerId, round, attempt, kind, payload };
}
const bothReady = (round: number) => [move(HOST, round, "ready"), move(GUEST, round, "ready")];
const bothPick = (round: number, h: number, g: number, attempt = 0) => [
  move(HOST, round, "answer", { picks: [h] }, attempt),
  move(GUEST, round, "answer", { picks: [g] }, attempt),
];
const lobbyDone = bothReady(LOBBY_ROUND);

describe("derive", () => {
  it("stays in the lobby until a guest joins and both are ready", () => {
    expect(derive(deck, { ...room, guestId: null }, [])).toEqual({ phase: "lobby" });
    expect(derive(deck, room, [move(HOST, LOBBY_ROUND, "ready")])).toEqual({ phase: "lobby" });
    expect(derive(deck, room, lobbyDone)).toEqual({ phase: "answer", round: 0, attempt: 0, step: 1 });
  });

  it("reveals only when both answered, advances only when both are ready", () => {
    const one = [...lobbyDone, move(HOST, 0, "answer", { picks: [0] })];
    expect(derive(deck, room, one).phase).toBe("answer");
    const both = [...lobbyDone, ...bothPick(0, 0, 1)];
    expect(derive(deck, room, both)).toMatchObject({ phase: "reveal", round: 0 });
    expect(derive(deck, room, [...both, move(HOST, 0, "ready")]).phase).toBe("reveal");
    expect(derive(deck, room, [...both, ...bothReady(0)])).toMatchObject({
      phase: "answer",
      round: 1,
      step: 2,
    });
  });

  const toAgree = [...lobbyDone, ...bothPick(0, 0, 0), ...bothReady(0)];

  it("Must Agree retries on a mismatch and takes the matched branch", () => {
    const miss = [...toAgree, ...bothPick(1, 0, 1)];
    expect(derive(deck, room, miss)).toMatchObject({ phase: "answer", round: 1, attempt: 1 });
    const hit = [...miss, ...bothPick(1, 1, 1, 1)];
    expect(derive(deck, room, hit)).toMatchObject({ phase: "reveal", round: 1, attempt: 1 });
    expect(derive(deck, room, [...hit, ...bothReady(1)])).toMatchObject({
      phase: "answer",
      round: 3,
      step: 3,
    });
  });

  it("Must Agree fails after the last try and takes the failed branch", () => {
    const fails = [...toAgree, ...bothPick(1, 0, 1, 0), ...bothPick(1, 0, 1, 1), ...bothPick(1, 0, 1, 2)];
    expect(derive(deck, room, fails)).toMatchObject({ phase: "reveal", round: 1, attempt: 2 });
    expect(derive(deck, room, [...fails, ...bothReady(1)])).toMatchObject({ phase: "answer", round: 2 });
  });

  it("ignores moves from a guest who was removed", () => {
    const stale = [move(HOST, LOBBY_ROUND, "ready"), move("old-guest", LOBBY_ROUND, "ready")];
    expect(derive(deck, room, stale)).toEqual({ phase: "lobby" });
  });

  it("an ended room is ended regardless of moves", () => {
    expect(derive(deck, { ...room, endedAt: new Date() }, lobbyDone)).toEqual({ phase: "ended" });
  });

  it("counts branch alternatives once", () => {
    expect(plannedLength(deck)).toBe(4);
  });
});

describe("checkMove", () => {
  const at0 = lobbyDone;
  it("accepts the current move and rejects stale, duplicate and outsider moves", () => {
    expect(checkMove(deck, room, at0, { playerId: HOST, round: 0, attempt: 0, kind: "answer" })).toBe("ok");
    expect(checkMove(deck, room, at0, { playerId: HOST, round: 1, attempt: 0, kind: "answer" })).toBe("stale");
    expect(checkMove(deck, room, at0, { playerId: HOST, round: 0, attempt: 1, kind: "answer" })).toBe("stale");
    expect(checkMove(deck, room, at0, { playerId: HOST, round: 0, attempt: 0, kind: "ready" })).toBe("stale");
    expect(checkMove(deck, room, at0, { playerId: "stranger", round: 0, attempt: 0, kind: "answer" })).toBe(
      "not-player"
    );
    const answered = [...at0, move(HOST, 0, "answer", { picks: [0] })];
    expect(checkMove(deck, room, answered, { playerId: HOST, round: 0, attempt: 0, kind: "answer" })).toBe(
      "duplicate"
    );
  });

  it("lobby ready needs a guest", () => {
    const solo = { ...room, guestId: null };
    expect(checkMove(deck, solo, [], { playerId: HOST, round: LOBBY_ROUND, attempt: 0, kind: "ready" })).toBe(
      "stale"
    );
    expect(checkMove(deck, room, [], { playerId: HOST, round: LOBBY_ROUND, attempt: 0, kind: "ready" })).toBe(
      "ok"
    );
  });
});

describe("viewFor", () => {
  const base = {
    deck,
    room: { ...room, id: "r", code: "ABC123", mode: "couple" as const, deckId: deck.id, seq: 7 },
    texts: [],
    players: { host: { name: "Alice", avatarUrl: null }, guest: { name: "Bob", avatarUrl: null } },
  };

  it("never shows the partner's answer before the reveal", () => {
    const moves = [...lobbyDone, move(GUEST, 0, "answer", { picks: [1] })];
    const hostView = viewFor({ ...base, moves, viewerId: HOST });
    expect(hostView.partner.answered).toBe(true);
    expect(hostView.reveal).toBeNull();
    expect(JSON.stringify(hostView)).not.toContain('"picks":[1]');

    const revealed = viewFor({ ...base, moves: [...moves, move(HOST, 0, "answer", { picks: [0] })], viewerId: HOST });
    expect(revealed.reveal).toMatchObject({ host: { picks: [0] }, guest: { picks: [1] } });
    expect(revealed.version).toBe(7);
  });

  it("shows earlier Must Agree tries by design", () => {
    const moves = [...lobbyDone, ...bothPick(0, 0, 0), ...bothReady(0), ...bothPick(1, 0, 1)];
    const view = viewFor({ ...base, moves, viewerId: GUEST });
    expect(view.progress).toMatchObject({ phase: "answer", round: 1, attempt: 1 });
    expect(view.tries).toEqual([{ host: { picks: [0] }, guest: { picks: [1] } }]);
    expect(view.mine.answer).toBeNull();
  });

  it("hides the partner's text until the reveal", () => {
    const texts = [{ playerId: GUEST, round: 0, slot: "shared" as const, body: "secret", matchPct: null }];
    const view = viewFor({ ...base, texts, moves: lobbyDone, viewerId: HOST });
    expect(JSON.stringify(view)).not.toContain("secret");
  });
});

/** Any valid answer for a round, so the real deck can be played end to end. */
function someAnswer(round: Round, salt: number): Answer {
  switch (round.format) {
    case "pick":
    case "mind":
    case "agree":
      return { picks: [salt % round.options.length] };
    case "likely":
      return { picks: round.items.map((_, i) => (i + salt) % 2) };
    case "scale":
      return { picks: [salt % round.steps], guesses: [(salt + 1) % round.steps] };
    case "speed":
      return { picks: round.items.map((_, i) => (i === 0 ? null : (i + salt) % 2)) };
    case "write":
      return { texts: round.variant === "mirror" ? ["a", "b"] : ["a"] };
  }
}

describe("the current deck", () => {
  for (const [label, agreeOnDinner] of [["matched", true], ["failed", false]] as const) {
    it(`plays end to end with valid answers (dinner ${label})`, () => {
      const moves: MoveRow[] = [...lobbyDone];
      let steps = 0;
      for (let guard = 0; guard < 200; guard++) {
        const p = derive(CURRENT_DECK, room, moves);
        if (p.phase === "done") break;
        if (p.phase === "reveal") {
          moves.push(...bothReady(p.round));
          continue;
        }
        if (p.phase !== "answer") throw new Error(`unexpected ${p.phase}`);
        const round = CURRENT_DECK.rounds[p.round]!;
        if (p.attempt === 0) steps++;
        const host = someAnswer(round, 0);
        const guest = round.format === "agree" && agreeOnDinner ? host : someAnswer(round, 1);
        expect(answerSchema(round).safeParse(host).success).toBe(true);
        expect(answerSchema(round).safeParse(guest).success).toBe(true);
        moves.push(move(HOST, p.round, "answer", host, p.attempt), move(GUEST, p.round, "answer", guest, p.attempt));
      }
      expect(derive(CURRENT_DECK, room, moves)).toEqual({ phase: "done" });
      expect(steps).toBe(plannedLength(CURRENT_DECK));
    });
  }
});
