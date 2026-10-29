import { whoFor } from "./copy";
import type { Copy, Deck } from "./deck";
import { other, type Pair, type Seat } from "./engine";
import type { Moment } from "./scoring";
import { VIBE, vibeWord } from "./verdicts";

type Context = { deck: Deck; names: Pair<string>; viewer: Seat; t: (copy: Copy) => string };

const stripLead = (text: string) => text.replace(/^…\s*/, "");

/** A quote that ends its sentence: a label already ending in ".", "?" or "!" gets no second period. */
const quoteEnd = (text: string) => `“${text}”${/[.?!]$/.test(text) ? "" : "."}`;

/** Turns a scored moment into one line of copy, from the viewer's side. Selection is code; wording lives here. */
export function momentText(m: Moment, { deck, names, viewer, t }: Context): string {
  const who = whoFor(viewer, names);
  const partner = other(viewer);
  const round = deck.rounds[m.round];
  const optionLabel = (i: number) => (round && "options" in round ? t(round.options[i]!.label) : "?");
  const itemText = (i: number) => (round?.format === "likely" ? stripLead(t(round.items[i]!.text)) : "?");

  switch (m.kind) {
    case "same-pick":
      return `Same brain: you both picked ${quoteEnd(optionLabel(m.option))}`;
    case "mind": {
      const subject = other(m.guesser);
      return m.hit
        ? `${who(m.guesser, true)} knew exactly what ${who(subject)} would pick.`
        : `${who(m.guesser, true)} guessed ${quoteEnd(optionLabel(m.guess))} ${who(subject, true)} said ${quoteEnd(optionLabel(m.actual))} Talk later.`;
    }
    case "undisputed":
      return `Undisputed: ${who(m.who)} ${m.who === viewer ? "are" : "is"} more likely to ${itemText(m.item)}.`;
    case "denial":
      return `You say ${names[partner]} would ${itemText(m.item)}. ${names[partner]} says you would.`;
    case "both-claim":
      return `You both claim you’d ${itemText(m.item)}.`;
    case "dinner":
      if (m.failed) return m.budged === false ? "Dinner took every try and nobody budged. Nobody ate." : "Dinner took every try and you never landed on the same place. Nobody ate.";
      if (m.tries === 1) return "Dinner decided in one try. Suspicious.";
      return m.caved
        ? `Dinner took ${m.tries} tries. ${who(m.caved, true)} caved first.`
        : `Dinner took ${m.tries} tries. You both caved at the same time.`;
    case "close-call": {
      const placed = m.guesser ? `${who(m.guesser, true)} placed ${who(other(m.guesser))}` : "You both placed each other";
      return round?.format === "scale"
        ? `${placed} exactly right between “${t(round.left)}” and “${t(round.right)}”.`
        : `${placed} exactly right.`;
    }
    case "mirror": {
      const topic = (round?.format === "write" && round.topic) || "answer";
      const whose = m.about === viewer ? "your" : `${names[m.about]}’s`;
      return `${who(other(m.about), true)} guessed ${whose} ${topic}. ${vibeWord(m.pct) ?? ""}`.trim();
    }
    case "reactions":
      return `${who(m.who, true)} sent ${m.count} ${m.emoji} ${round ? `during ${quoteEnd(t(round.scene.title))}` : "in the lobby."}`;
  }
}

export type Mood = "hit" | "miss" | "reaction";

/** Whether a moment is a win for the two of you, a funny miss, or a reaction streak. */
export function momentMood(m: Moment): Mood {
  switch (m.kind) {
    case "same-pick":
    case "undisputed":
    case "close-call":
      return "hit";
    case "denial":
    case "both-claim":
      return "miss";
    case "mind":
      return m.hit ? "hit" : "miss";
    case "dinner":
      return m.failed ? "miss" : "hit";
    case "mirror":
      return m.pct >= VIBE.close ? "hit" : "miss";
    case "reactions":
      return "reaction";
  }
}
