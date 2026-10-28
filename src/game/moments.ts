import type { Copy, Deck } from "./deck";
import type { Pair, Seat } from "./engine";
import type { Moment } from "./scoring";

type Context = { deck: Deck; names: Pair<string>; t: (copy: Copy) => string };

const other = (seat: Seat): Seat => (seat === "host" ? "guest" : "host");
const stripLead = (text: string) => text.replace(/^…\s*/, "");

/** Turns a scored moment into one line of copy. Selection is code; wording lives here. */
export function momentText(m: Moment, { deck, names, t }: Context): string {
  const round = deck.rounds[m.round];
  const optionLabel = (i: number) => (round && "options" in round ? t(round.options[i]!.label) : "?");
  const itemText = (i: number) => (round?.format === "likely" ? stripLead(t(round.items[i]!.text)) : "?");

  switch (m.kind) {
    case "same-pick":
      return `Same brain: you both picked “${optionLabel(m.option)}”.`;
    case "mind": {
      const subject = other(m.guesser);
      return m.hit
        ? `${names[m.guesser]} knew exactly what ${names[subject]} would pick.`
        : `${names[m.guesser]} guessed “${optionLabel(m.guess)}”. ${names[subject]} said “${optionLabel(m.actual)}”. Talk later.`;
    }
    case "undisputed":
      return `Undisputed: ${names[m.who]} is more likely to ${itemText(m.item)}. Even ${names[m.who]} agreed.`;
    case "denial":
      return `${names.host} says ${names.guest} would ${itemText(m.item)}. ${names.guest} says ${names.host}. Someone's lying.`;
    case "both-claim":
      return `You both claim you'd ${itemText(m.item)}. Bold of you both.`;
    case "dinner":
      if (m.failed) return "Dinner took every try and nobody budged. Nobody ate.";
      if (m.tries === 1) return "Dinner decided in one try. Suspicious.";
      return m.caved
        ? `Dinner took ${m.tries} tries. ${names[m.caved]} caved first.`
        : `Dinner took ${m.tries} tries. You both caved at the same time.`;
    case "close-call":
      return `${names[m.guesser]} placed ${names[other(m.guesser)]} exactly right on “${round ? t(round.scene.title) : "the scale"}”.`;
    case "mirror":
      return `${names[other(m.about)]} guessed ${names[m.about]}'s ${(round?.format === "write" && round.topic) || "answer"} with a ${m.pct}% vibe match.`;
    case "reactions":
      return `${names[m.who]} sent ${m.count} ${m.emoji} during “${round ? t(round.scene.title) : "the lobby"}”.`;
  }
}
