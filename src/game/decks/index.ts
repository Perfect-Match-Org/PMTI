import type { Deck } from "../deck";
import { cornellDay1 } from "./cornell-day-1";

/** Decks are immutable once shipped: new content gets a new id, old ids stay while rooms use them. */
const DECKS: Record<string, Deck> = { [cornellDay1.id]: cornellDay1 };

export const CURRENT_DECK = cornellDay1;

export function getDeck(id: string): Deck | undefined {
  return DECKS[id];
}
