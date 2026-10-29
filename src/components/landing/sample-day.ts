import { say, whoFor } from "@/game/copy";
import type { Copy, Round } from "@/game/deck";
import { CURRENT_DECK } from "@/game/decks";
import { plannedLength, type Pair, type PlayerInfo, type RevealData } from "@/game/engine";
import { verdictFor, type Tone } from "@/game/verdicts";

/**
 * The couple the landing shows playing, the deck's rounds and then their result card: Touchdown, the
 * Big Red Bear, and Ezra Cornell, dating in a parallel universe.
 */
export const SAMPLE_NAMES: Pair<string> = { host: "Touchdown", guest: "Ezra" };
export const SAMPLE_PLAYERS: Pair<PlayerInfo> = {
  host: { name: SAMPLE_NAMES.host, avatarUrl: null },
  guest: { name: SAMPLE_NAMES.guest, avatarUrl: null },
};
/** Nobody is "you" on the landing: both go by name. */
export const sampleWho = whoFor(null, SAMPLE_NAMES);
export const sampleSay = (copy: Copy) => say(copy, "couple", { p: SAMPLE_NAMES.guest, s: SAMPLE_NAMES.host });

/** One round of the sample day; `step` is its place in a game, `land` when both answers show, in ms. */
export type Beat = { step: number; time: string; scene: string; ask: string; round: Round; reveal: RevealData; verdict: string; tone: Tone; land: number };

/**
 * Real rounds from the current deck with made-up answers. The answers are drawn and judged by the
 * game's own reveal and verdict rules, so the landing (and the link preview) can't promise anything
 * the game doesn't do.
 */
export const SAMPLES: { id: string; reveal: RevealData }[] = [
  { id: "prelim-morning", reveal: { host: { picks: [0] }, guest: { picks: [0] }, texts: [] } },
  { id: "group-project", reveal: { host: { picks: [1, 1, 1] }, guest: { picks: [1, 1, 1] }, texts: [] } },
  { id: "dinner", reveal: { host: { picks: [0] }, guest: { picks: [0] }, texts: [] } },
  {
    id: "comfort-order",
    reveal: {
      host: {},
      guest: {},
      texts: [
        { seat: "host", slot: "self", body: "Spicy noodles from Collegetown, extra chili oil", matchPct: null },
        { seat: "guest", slot: "partner", body: "Grilled cheese and tomato soup", matchPct: 21 },
      ],
    },
  },
  { id: "slope-night", reveal: { host: { picks: [4], guesses: [3] }, guest: { picks: [5], guesses: [2] }, texts: [] } },
];

export const BEATS: Beat[] = SAMPLES.flatMap(({ id, reveal }) => {
  const round = CURRENT_DECK.rounds.find((r) => r.id === id);
  if (!round) return [];
  const verdict = verdictFor(round, reveal, null, sampleWho, 1);
  // Option rows read fastest; cards with more words on them hold the question longer.
  const land = "options" in round ? 2200 : 2600;
  // Its place in a game as played: the rounds up to it, with branch alternatives counted once.
  const step = plannedLength({ ...CURRENT_DECK, rounds: CURRENT_DECK.rounds.slice(0, CURRENT_DECK.rounds.indexOf(round) + 1) });
  return [{ step, time: round.scene.time, scene: sampleSay(round.scene.title), ask: sampleSay(round.prompt), round, reveal, verdict: verdict.text, tone: verdict.tone, land }];
});
