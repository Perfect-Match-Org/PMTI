export type Axis = "E" | "P" | "H";
export type Weights = Partial<Record<Axis, number>>;

/** Copy that differs between couple and friends mode. Supports {p} (partner) and {s} (subject). */
export type Copy = string | { couple: string; friends: string };

export type Scene = { time: string; title: Copy };

export type Option = { label: Copy; w?: Weights };

type RoundBase = {
  /** Stable within a deck; used by `ifPrev`. */
  id: string;
  scene: Scene;
  /** Only play this round if an earlier round's two picks matched / didn't match. */
  ifPrev?: { round: string; is: "matched" | "failed" };
};

/** Both pick in secret, then reveal side by side. */
export type PickRound = RoundBase & { format: "pick"; prompt: Copy; options: Option[] };

/** The subject answers about themselves while the partner guesses the subject's answer. */
export type MindRound = RoundBase & {
  format: "mind";
  subject: "host" | "guest";
  prompt: Copy;
  guessPrompt: Copy;
  options: Option[];
};

/** "Who's more likely to…": each item is answered with 0 = me, 1 = partner. */
export type LikelyRound = RoundBase & {
  format: "likely";
  prompt: Copy;
  items: { text: Copy; nudge: Weights; brag?: boolean }[];
};

/** Place yourself on a scale, then place a ghost marker where you think your partner is. */
export type ScaleRound = RoundBase & {
  format: "scale";
  prompt: Copy;
  left: Copy;
  right: Copy;
  axis: Axis;
  /** Weight of the far-left end; the far-right end is the negation. */
  leftWeight: number;
  steps: number;
};

/** Must land on the same option; partner's earlier picks are shown between tries. */
export type AgreeRound = RoundBase & {
  format: "agree";
  prompt: Copy;
  options: Option[];
  tries: number;
};

/** Quick this-or-that pairs; the timer is visual only, unanswered items are null. */
export type SpeedRound = RoundBase & {
  format: "speed";
  prompt: Copy;
  seconds: number;
  items: [Option, Option][];
};

/**
 * Free text. `mirror`: each writes about themselves and about the partner.
 * `shared`: both answer the same prompt. `poolKey` groups answers across deck versions for scoring.
 * Ask for concrete things (an order, a place), not adjectives: embedding similarity can't tell
 * opposites apart ("always early" vs "always late" score as near-identical).
 */
export type WriteRound = RoundBase & {
  format: "write";
  variant: "mirror" | "shared";
  prompt: Copy;
  /** Mirror only: the prompt for the line about the partner. */
  partnerPrompt?: Copy;
  /** What the answer is, for result copy: "guessed Bob's comfort order". */
  topic?: string;
  poolKey: string;
};

export type Round =
  | PickRound
  | MindRound
  | LikelyRound
  | ScaleRound
  | AgreeRound
  | SpeedRound
  | WriteRound;

export type Deck = {
  id: string;
  intro: Copy;
  rounds: Round[];
};

export const MAX_TEXT_LENGTH = 140;
