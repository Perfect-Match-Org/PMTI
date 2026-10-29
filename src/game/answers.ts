import type { Round } from "./deck";
import type { TextSlot } from "./engine";

/**
 * What a player submits for a round. Option rounds use `picks` (one index per item; for
 * `likely`, 0 = me and 1 = partner; for `speed`, null = skipped). Scale rounds add `guesses`.
 * Write rounds submit `texts`, which the server stores in the texts table, not in the move.
 */
export type Answer = { picks?: (number | null)[]; guesses?: number[]; texts?: string[] };

/** The text boxes a write round asks for, in order: a mirror round is about you, then your partner. */
export function slotsFor(round: Extract<Round, { format: "write" }>): TextSlot[] {
  return round.variant === "mirror" ? ["self", "partner"] : ["shared"];
}

export function samePicks(a: Answer | undefined, b: Answer | undefined): boolean {
  const x = a?.picks;
  const y = b?.picks;
  return !!x && !!y && x.length === y.length && x.every((pick, i) => pick === y[i]);
}
