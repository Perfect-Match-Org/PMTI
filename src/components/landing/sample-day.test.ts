import { expect, it } from "vitest";
import { slotsFor } from "@/game/answers";
import { CURRENT_DECK } from "@/game/decks";
import { answerSchema } from "@/game/schemas";
import { SAMPLES } from "./sample-day";

it("plays only real rounds, with answers the game itself would accept", () => {
  for (const { id, reveal } of SAMPLES) {
    const round = CURRENT_DECK.rounds.find((r) => r.id === id);
    expect(round, `landing sample "${id}" is not in ${CURRENT_DECK.id}`).toBeDefined();
    if (round!.format === "write") {
      const slots: string[] = slotsFor(round!);
      for (const { slot } of reveal.texts) expect(slots, id).toContain(slot);
      continue;
    }
    for (const seat of ["host", "guest"] as const) {
      expect(answerSchema(round!).safeParse(reveal[seat]).success, `${id}: ${seat}'s sample answer`).toBe(true);
    }
  }
});
