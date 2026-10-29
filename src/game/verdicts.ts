import type { Answer } from "./answers";
import type { Who } from "./copy";
import type { Round } from "./deck";
import { other, type Pair, type Seat, type ViewText } from "./engine";

/** How a round went, which the screens turn into a color. */
export type Tone = "match" | "between" | "miss";
export type Verdict = { text: string; tone: Tone };
type Reveal = Pair<Answer> & { texts: ViewText[] };

/**
 * Where one "who's more likely" item lands. With two players there are only four outcomes: both name
 * the same person, both claim it, or both point at the other. The verdict, the reveal and scoring share this.
 */
export type LikelyItem = { kind: "agreed"; named: Seat } | { kind: "both-claim" } | { kind: "denial" };

export function likelyItem(hostPick: number | null | undefined, guestPick: number | null | undefined): LikelyItem | null {
  if (hostPick == null || guestPick == null) return null;
  const named = (s: Seat, p: number) => (p === 0 ? s : other(s));
  const host = named("host", hostPick);
  if (host === named("guest", guestPick)) return { kind: "agreed", named: host };
  return hostPick === 0 ? { kind: "both-claim" } : { kind: "denial" };
}

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
      if (!same()) return { text: "No dinner tonight.", tone: "miss" };
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
      const items = round.items.map((_, i) => likelyItem(pick("host", i), pick("guest", i))?.kind);
      const agreed = items.filter((k) => k === "agreed").length;
      if (agreed === items.length) return { text: "Fully agreed.", tone: "match" };
      if (items.every((k) => k === "denial")) return { text: "Total denial.", tone: "miss" };
      if (items.every((k) => k === "both-claim")) return { text: "You both claim everything.", tone: "miss" };
      return { text: `${agreed} of ${items.length} agreed.`, tone: agreed ? "between" : "miss" };
    }
    case "scale": {
      const offBy = (about: Seat) => Math.abs((reveal[other(about)].guesses?.[0] ?? 0) - (pick(about) ?? 0));
      const partner = other(viewer);
      const mine = offBy(partner);
      const theirs = offBy(viewer);
      if (mine === 0 && theirs === 0) return { text: "You both nailed it.", tone: "match" };
      if (mine === 0) return { text: "You nailed it.", tone: "match" };
      if (theirs === 0) return { text: `${who(partner, true)} nailed it.`, tone: "match" };
      // Name the closer guess: a bare "Off by 1" read as wrong to whoever was 6 off.
      const best = Math.min(mine, theirs);
      const tone = best * 2 >= round.steps - 1 ? "miss" : "between";
      if (mine === theirs) return { text: `Both off by ${best}.`, tone };
      return { text: `${mine < theirs ? "You" : who(partner, true)} came closest: off by ${best}.`, tone };
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
