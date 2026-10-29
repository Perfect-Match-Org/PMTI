import type { Answer } from "@/game/answers";
import { say, whoFor } from "@/game/copy";
import type { Copy, Option, Round } from "@/game/deck";
import { CURRENT_DECK } from "@/game/decks";
import { other, plannedLength, SEATS, type Pair, type PlayerInfo, type Seat, type ViewText } from "@/game/engine";
import { namedBy, verdictFor, type Tone } from "@/game/verdicts";

/**
 * The couple the landing shows playing, the deck's rounds and then their result card: Touchdown, the
 * Big Red Bear, and Ezra Cornell, dating in a parallel universe.
 */
export const SAMPLE_NAMES: Pair<string> = { host: "Touchdown", guest: "Ezra" };
export const SAMPLE_PLAYERS: Pair<PlayerInfo> = {
  host: { name: SAMPLE_NAMES.host, avatarUrl: null },
  guest: { name: SAMPLE_NAMES.guest, avatarUrl: null },
};

const s = (copy: Copy) => say(copy, "couple", { p: SAMPLE_NAMES.guest, s: SAMPLE_NAMES.host });

export type Mark = { by: Seat; at: number; guess?: boolean };
export type Body =
  | { kind: "rows"; rows: string[]; marks: Mark[] }
  | { kind: "pairs"; items: { text: string; marks: Mark[] }[] }
  | { kind: "rail"; steps: number; left: string; right: string; tracks: { owner: Seat; note: string; marks: Mark[] }[] }
  | { kind: "notes"; notes: { by: Seat; caption: string; text: string }[] };
/** One round of the sample day as the landing plays it; `land` is when both answers show, in ms. */
export type Beat = { round: number; time: string; scene: string; ask: string; body: Body; verdict: string; tone: Tone; land: number };

type Sample = { id: string; answers: Pair<Answer>; texts?: ViewText[]; show: (round: Round, answers: Pair<Answer>, texts: ViewText[]) => Body | null };

const picked = (answers: Pair<Answer>, item = 0): Mark[] => SEATS.map((by) => ({ by, at: answers[by].picks![item]! }));
const optionRows = (options: Option[], answers: Pair<Answer>): Body => ({ kind: "rows", rows: options.map((o) => s(o.label)), marks: picked(answers) });

/**
 * Real rounds from the current deck with made-up answers. The verdict comes from the game's own
 * rules, so the landing (and the link preview) can't promise a line the game never says.
 */
const SAMPLES: Sample[] = [
  {
    id: "prelim-morning",
    answers: { host: { picks: [0] }, guest: { picks: [0] } },
    show: (r, a) => (r.format === "pick" ? optionRows(r.options, a) : null),
  },
  {
    id: "group-project",
    answers: { host: { picks: [1, 1, 1] }, guest: { picks: [1, 1, 1] } },
    show: (r, a) =>
      r.format === "likely"
        ? {
            kind: "pairs",
            // `at` is the seat each player named, host first.
            items: r.items.map((item, i) => ({
              text: s(item.text),
              marks: SEATS.map((by) => ({ by, at: namedBy(by, a[by].picks![i]!) === "host" ? 0 : 1 })),
            })),
          }
        : null,
  },
  {
    id: "dinner",
    answers: { host: { picks: [0] }, guest: { picks: [0] } },
    show: (r, a) => (r.format === "agree" ? optionRows(r.options, a) : null),
  },
  {
    id: "comfort-order",
    answers: { host: {}, guest: {} },
    texts: [
      { seat: "host", slot: "self", body: "Spicy noodles from Collegetown, extra chili oil", matchPct: null },
      { seat: "guest", slot: "partner", body: "Grilled cheese and tomato soup", matchPct: 21 },
    ],
    show: (r, _, texts) =>
      r.format === "write"
        ? {
            kind: "notes",
            notes: texts.map((t) => ({
              by: t.seat,
              caption: t.slot === "partner" ? `${SAMPLE_NAMES[t.seat]}’s guess` : SAMPLE_NAMES[t.seat],
              text: t.body,
            })),
          }
        : null,
  },
  {
    id: "slope-night",
    answers: { host: { picks: [4], guesses: [3] }, guest: { picks: [5], guesses: [2] } },
    show: (r, a) =>
      r.format === "scale"
        ? {
            kind: "rail",
            steps: r.steps,
            left: s(r.left),
            right: s(r.right),
            tracks: SEATS.map((owner) => {
              const at = a[owner].picks![0]!;
              const guess = a[other(owner)].guesses![0]!;
              return {
                owner,
                note: `${SAMPLE_NAMES[other(owner)]} was ${Math.abs(guess - at)} off`,
                marks: [
                  { by: owner, at },
                  { by: other(owner), at: guess, guess: true },
                ],
              };
            }),
          }
        : null,
  },
];

export const BEATS: Beat[] = SAMPLES.flatMap((sample) => {
  const round = CURRENT_DECK.rounds.find((r) => r.id === sample.id);
  const texts = sample.texts ?? [];
  const body = round && sample.show(round, sample.answers, texts);
  if (!round || !body) return [];
  const verdict = verdictFor(round, { ...sample.answers, texts }, "host", whoFor("host", SAMPLE_NAMES), 1);
  // Option rows read fastest; cards with more words on them hold the question longer.
  const land = body.kind === "rows" ? 2200 : 2600;
  // Its place in a game as played: the rounds up to it, with branch alternatives counted once.
  const step = plannedLength({ ...CURRENT_DECK, rounds: CURRENT_DECK.rounds.slice(0, CURRENT_DECK.rounds.indexOf(round) + 1) });
  return [{ round: step, time: round.scene.time, scene: s(round.scene.title), ask: s(round.prompt), body, verdict: verdict.text, tone: verdict.tone, land }];
});
