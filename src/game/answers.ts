import { z } from "zod";
import { MAX_TEXT_LENGTH, type Round } from "./deck";

/**
 * What a player submits for a round. Option rounds use `picks` (one index per item; for
 * `likely`, 0 = me and 1 = partner; for `speed`, null = skipped). Scale rounds add `guesses`.
 * Write rounds submit `texts`, which the server stores in the texts table, not in the move.
 */
export type Answer = { picks?: (number | null)[]; guesses?: number[]; texts?: string[] };

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
      return z.object({
        texts: round.variant === "mirror" ? z.tuple([text, text]) : z.tuple([text]),
      });
  }
}

export function samePicks(a: Answer | undefined, b: Answer | undefined): boolean {
  const x = a?.picks;
  const y = b?.picks;
  return !!x && !!y && x.length === y.length && x.every((pick, i) => pick === y[i]);
}
