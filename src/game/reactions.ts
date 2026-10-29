
export const REACTIONS = ["❤️", "😂", "😱", "🍅", "👀"] as const;
export type Reaction = (typeof REACTIONS)[number];

export const REACTION_LABELS: Record<Reaction, string> = {
  "❤️": "love",
  "😂": "laugh",
  "😱": "shock",
  "🍅": "boo",
  "👀": "side-eye",
};

export type ReactionTally = Partial<Record<Reaction, number>>;

/** Reaction counts keyed by round number: a `ready` move carries every count not sent yet. */
export type RoundTallies = Record<string, ReactionTally>;
