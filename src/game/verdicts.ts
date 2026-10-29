import type { Answer } from "./answers";
import type { Who } from "./copy";
import type { Round } from "./deck";
import type { Pair, Seat, ViewText } from "./engine";

/** How a round went, which the screens turn into a color. */
export type Tone = "match" | "between" | "miss";
export type Verdict = { text: string; tone: Tone };
type Reveal = Pair<Answer> & { texts: ViewText[] };

const other = (seat: Seat): Seat => (seat === "host" ? "guest" : "host");

/** Vibe-match tiers: at or above `same` reads as a match, below `close` as a miss. */
export const VIBE = { same: 75, close: 45 };

/** Free-text similarity as words: the number is a rough signal, not something to argue over. */
export function vibeWord(pct: number | null | undefined): string | null {
  if (pct == null) return null;
  return pct >= VIBE.same ? "Same wavelength." : pct >= VIBE.close ? "Close enough." : "Different planets.";
}

export function averagePct(pcts: (number | null | undefined)[]): number | null {
  const known = pcts.filter((p): p is number => p != null);
  return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
}

/** One verdict per round: the reveal flash shows it, then the headline keeps it. */
export function verdictFor(round: Round, reveal: Reveal, viewer: Seat, who: Who, attempts: number): Verdict {
  const pick = (s: Seat, i = 0) => reveal[s].picks?.[i];
  const same = (i = 0) => pick("host", i) != null && pick("host", i) === pick("guest", i);

  switch (round.format) {
    case "pick":
      return same() ? { text: "Same brain.", tone: "match" } : { text: "Two different answers.", tone: "between" };
    case "agree":
      if (!same()) return { text: "Nobody budged.", tone: "miss" };
      return attempts === 1 ? { text: "Agreed in one try. Suspicious.", tone: "match" } : { text: "Agreed, eventually.", tone: "match" };
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      if (same()) {
        return guesser === viewer
          ? { text: `You read ${who(subject)}’s mind.`, tone: "match" }
          : { text: `${who(guesser, true)} read your mind.`, tone: "match" };
      }
      return { text: `${who(guesser, true)} guessed wrong.`, tone: "between" };
    }
    case "likely": {
      const target = (s: Seat, i: number) => (pick(s, i) === 0 ? s : other(s));
      const agreed = round.items.filter((_, i) => target("host", i) === target("guest", i)).length;
      if (agreed === round.items.length) return { text: "Fully agreed.", tone: "match" };
      if (agreed === 0) return { text: "Total denial.", tone: "miss" };
      return { text: `${agreed} of ${round.items.length} agreed.`, tone: "between" };
    }
    case "scale": {
      const offBy = (about: Seat) => Math.abs((reveal[other(about)].guesses?.[0] ?? 0) - (pick(about) ?? 0));
      const partner = other(viewer);
      const mine = offBy(partner);
      const theirs = offBy(viewer);
      if (mine === 0 && theirs === 0) return { text: "You both nailed it.", tone: "match" };
      if (mine === 0) return { text: "You nailed it.", tone: "match" };
      if (theirs === 0) return { text: `${who(partner, true)} nailed it.`, tone: "match" };
      return { text: `Off by ${Math.min(mine, theirs)}.`, tone: "between" };
    }
    case "speed": {
      const matches = round.items.filter((_, i) => same(i)).length;
      return { text: `${matches} of ${round.items.length} the same.`, tone: matches >= 4 ? "match" : "between" };
    }
    case "write": {
      const pct = averagePct(reveal.texts.filter((t) => t.slot !== "self").map((t) => t.matchPct));
      const word = vibeWord(pct);
      if (!word) return { text: "Two takes.", tone: "between" };
      return { text: word, tone: pct! >= VIBE.same ? "match" : pct! >= VIBE.close ? "between" : "miss" };
    }
  }
}
