import { describe, expect, it } from "vitest";
import seeds from "../../../supabase/seed-pool.json";
import { MIN_POOL } from "@/server/similarity";
import { slotsFor } from "../answers";
import { CURRENT_DECK } from ".";

const pools: Record<string, string[]> = seeds;

describe(CURRENT_DECK.id, () => {
  const { rounds } = CURRENT_DECK;

  it("names every round once", () => {
    const ids = rounds.map((r) => r.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it("branches only on an earlier round, or the branch would never play", () => {
    rounds.forEach((round, i) => {
      if (!round.ifPrev) return;
      expect(rounds.slice(0, i).map((r) => r.id), round.id).toContain(round.ifPrev.round);
    });
  });

  it("has enough seed answers for every free-text box to score from the first game", () => {
    for (const round of rounds) {
      if (round.format !== "write") continue;
      for (const slot of slotsFor(round)) {
        const key = `${round.poolKey}:${slot}`;
        expect(pools[key]?.length ?? 0, `${key} in supabase/seed-pool.json`).toBeGreaterThanOrEqual(MIN_POOL);
      }
    }
  });
});
