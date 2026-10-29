
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
