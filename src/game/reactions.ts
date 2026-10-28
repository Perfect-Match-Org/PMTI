import { z } from "zod";

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

/** A `ready` move may carry how many reactions this player sent during the round. */
export const readyPayloadSchema = z.object({
  reactions: z.partialRecord(z.enum(REACTIONS), z.number().int().min(1).max(9999)).optional(),
});
