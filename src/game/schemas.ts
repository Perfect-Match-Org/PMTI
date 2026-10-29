import { z } from "zod";
import { slotsFor } from "./answers";
import { MAX_TEXT_LENGTH, type Round } from "./deck";
import { REACTIONS } from "./reactions";
import type { Answer } from "./answers";

// Only the server validates; keeping zod here keeps it out of the browser bundle.

const index = (count: number) => z.number().int().min(0).max(count - 1);
const text = z.string().trim().min(1).max(MAX_TEXT_LENGTH);

export function answerSchema(round: Round): z.ZodType<Answer> {
  switch (round.format) {
    case "pick":
    case "mind":
    case "agree":
      return z.object({ picks: z.tuple([index(round.options.length)]) });
    case "likely":
      return z.object({ picks: z.array(index(2)).length(round.items.length) });
    case "scale":
      return z.object({
        picks: z.tuple([index(round.steps)]),
        guesses: z.tuple([index(round.steps)]),
      });
    case "speed":
      return z.object({ picks: z.array(index(2).nullable()).length(round.items.length) });
    case "write":
      return z.object({ texts: slotsFor(round).length === 2 ? z.tuple([text, text]) : z.tuple([text]) });
  }
}

const tally = z.partialRecord(z.enum(REACTIONS), z.number().int().min(1).max(9999));

/** A `ready` move may carry this player's reaction counts not sent yet, keyed by round. */
export const readyPayloadSchema = z.object({
  reactions: z.record(z.string().regex(/^-?\d{1,3}$/), tally).optional(),
});
