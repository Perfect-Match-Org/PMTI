import { describe, expect, it } from "vitest";
import type { Answer } from "./answers";
import type { Deck, Round } from "./deck";
import type { Seat } from "./engine";
import { score } from "./scoring";
import { play, ROOM } from "./test-utils";

const scene = { time: "9am", title: "t" };
const two = [
  { label: "out-plan-show", w: { E: 2, P: 2, H: -2 } },
  { label: "in-wing-say", w: { E: -2, P: -2, H: 2 } },
];
const deck: Deck = {
  id: "scoring-test@1",
  intro: "",
  rounds: [
    { id: "p1", scene, format: "pick", prompt: "", options: two },
    { id: "p2", scene, format: "pick", prompt: "", options: two },
    { id: "mind", scene, format: "mind", subject: "host", prompt: "", guessPrompt: "", options: two },
    { id: "dinner", scene, format: "agree", prompt: "", tries: 3, options: [{ label: "a" }, { label: "b" }] },
    {
      id: "likely",
      scene,
      format: "likely",
      prompt: "",
      items: [
        { text: "brag", nudge: { E: 1 }, brag: true },
        { text: "plain", nudge: { H: -1 } },
      ],
    },
  ],
};

type Plan = Partial<Record<string, Partial<Record<Seat, number[] | ((attempt: number) => number[])>>>>;

/** Scripted answers by round id; anything unspecified picks option 0. */
function run(plan: Plan, reactions?: Parameters<typeof play>[1]["reactions"]) {
  const log = play(deck, {
    answer: (seat: Seat, round: Round, _i: number, attempt: number): Answer => {
      const entry = plan[round.id]?.[seat];
      const picks = typeof entry === "function" ? entry(attempt) : (entry ?? (round.format === "likely" ? [0, 0] : [0]));
      return { picks };
    },
    reactions,
  });
  return score(deck, ROOM, log.moves, log.texts);
}

describe("score", () => {
  it("in-sync pair that reads minds is the Dream Team", () => {
    const r = run({ likely: { host: [1, 0], guest: [0, 1] } });
    expect(r.sameBrain).toBeGreaterThanOrEqual(0.85);
    expect(r.mindReading).toBe(1);
    expect(r.type).toBe("founders");
  });

  it("failed dinner plus missed guesses is Prelims & Finals", () => {
    const r = run({
      mind: { guest: [1] },
      dinner: { host: () => [0], guest: () => [1] },
      likely: { host: [1, 0], guest: [0, 1] },
    });
    expect(r.features.friction).toBe(1);
    expect(r.type).toBe("prelims-finals");
    expect(r.moments.some((m) => m.kind === "dinner" && m.failed)).toBe(true);
  });

  it("both claiming the brag in an outgoing duo that argued over dinner is Cornell vs. Harvard", () => {
    const r = run({
      p2: { guest: [1] },
      mind: { guest: [1] },
      dinner: { host: (a) => [a === 0 ? 1 : 0], guest: () => [0] },
      likely: { host: [0, 0], guest: [0, 1] },
    });
    expect(r.features.claims).toBe(1);
    expect(r.type).toBe("cornell-harvard");
    expect(r.moments.map((m) => m.kind)).toContain("both-claim");
  });

  it("opposite answers on every axis is an opposites type, roles by axis", () => {
    const r = run({
      p1: { guest: [1] },
      p2: { guest: [1] },
      mind: { guest: [1] },
      likely: { host: [1, 0], guest: [0, 1] },
    });
    // Pace has no "likely" nudges diluting it, so it is the widest gap here.
    expect(r.features.gap.P).toBe(2);
    expect(r.type).toBe("syllabus-snowday");
    expect(r.roles).toEqual({ host: 0, guest: 1 });
  });

  it("a pair that leans the same way but can't read minds lands in its corner", () => {
    const r = run({ mind: { guest: [1] }, likely: { host: [1, 0], guest: [0, 1] } });
    expect(r.mindReading).toBe(0);
    expect(r.type).toBe("lynah-lindseth");
    expect(r.runnerUp).not.toBe(r.type);
    // Both "likely" votes made the guest the outgoing one, so the guest is Lynah.
    expect(r.roles).toEqual({ host: 1, guest: 0 });
  });

  it("detects who caved at dinner and big reaction spam", () => {
    const r = run(
      { dinner: { host: (a) => [a === 0 ? 0 : 1], guest: () => [1] }, likely: { host: [1, 1], guest: [1, 1] } },
      (seat, index) => (seat === "guest" && index === 3 ? { "🍅": 41 } : undefined)
    );
    const kinds = r.moments.map((m) => m.kind);
    expect(r.moments).toHaveLength(3);
    expect(kinds).toContain("reactions");
    expect(kinds).toContain("denial");
    expect(r.features.switches).toEqual({ host: 1, guest: 0 });
    expect(r.moments.find((m) => m.kind === "dinner")).toMatchObject({ caved: "host", tries: 2 });
  });
});
