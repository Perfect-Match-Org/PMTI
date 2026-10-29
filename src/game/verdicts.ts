import type { Who } from "./copy";
import type { Round } from "./deck";
import { other, type RevealData, type Seat } from "./engine";

/** How a round went, which the screens turn into a color. */
export type Tone = "match" | "between" | "miss";
export type Verdict = { text: string; tone: Tone };

/**
 * Where one "who's more likely" item lands. With two players there are only four outcomes: both name
 * the same person, both claim it, or both point at the other. The verdict, the reveal and scoring share this.
 */
export type LikelyItem = { kind: "agreed"; named: Seat } | { kind: "both-claim" } | { kind: "denial" };

/** Who a "likely" pick names: 0 is yourself, 1 is your partner. */
export const namedBy = (voter: Seat, pick: number): Seat => (pick === 0 ? voter : other(voter));

export function likelyItem(hostPick: number | null | undefined, guestPick: number | null | undefined): LikelyItem | null {
  if (hostPick == null || guestPick == null) return null;
  const host = namedBy("host", hostPick);
  if (host === namedBy("guest", guestPick)) return { kind: "agreed", named: host };
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
/** `viewer` null is the landing's view of its sample couple: both named, nobody "you". */
export function verdictFor(round: Round, reveal: RevealData, viewer: Seat | null, who: Who, attempts: number): Verdict {
  const pick = (s: Seat, i = 0) => reveal[s].picks?.[i];
  const same = (i = 0) => pick("host", i) != null && pick("host", i) === pick("guest", i);

  switch (round.format) {
    case "pick":
      return same() ? { text: "Same brain.", tone: "match" } : { text: "Opposites, noted.", tone: "between" };
    case "agree":
      if (!same()) return { text: "No dinner tonight.", tone: "miss" };
      return attempts === 1 ? { text: "Agreed in one try. Suspicious.", tone: "match" } : { text: "Agreed, eventually.", tone: "match" };
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      if (same()) {
        return subject === viewer
          ? { text: `${who(guesser, true)} read your mind.`, tone: "match" }
          : { text: `${who(guesser, true)} read ${who(subject)}’s mind.`, tone: "match" };
      }
      return { text: `${who(guesser, true)} guessed wrong.`, tone: "between" };
    }
    case "likely": {
      const items = round.items.map((_, i) => likelyItem(pick("host", i), pick("guest", i))?.kind);
      const agreed = items.filter((k) => k === "agreed").length;
      if (agreed === items.length) return { text: "Fully agreed.", tone: "match" };
      if (items.every((k) => k === "denial")) return { text: "Total denial.", tone: "miss" };
      if (items.every((k) => k === "both-claim")) return { text: `${viewer ? "You both" : "Both"} claim everything.`, tone: "miss" };
      return { text: `${agreed} of ${items.length} agreed.`, tone: agreed ? "between" : "miss" };
    }
    case "scale": {
      const offBy = (about: Seat) => Math.abs((reveal[other(about)].guesses?.[0] ?? 0) - (pick(about) ?? 0));
      const me = viewer ?? "host";
      const partner = other(me);
      const mine = offBy(partner);
      const theirs = offBy(me);
      if (mine === 0 && theirs === 0) return { text: `${viewer ? "You both" : "Both"} nailed it.`, tone: "match" };
      if (mine === 0) return { text: `${who(me, true)} nailed it.`, tone: "match" };
      if (theirs === 0) return { text: `${who(partner, true)} nailed it.`, tone: "match" };
      // Name the closer guess: a bare "Off by 1" read as wrong to whoever was 6 off.
      const best = Math.min(mine, theirs);
      const tone = best * 2 >= round.steps - 1 ? "miss" : "between";
      if (mine === theirs) return { text: `Both off by ${best}.`, tone };
      return { text: `${who(mine < theirs ? me : partner, true)} came closest: off by ${best}.`, tone };
    }
    case "speed": {
      const matches = round.items.filter((_, i) => same(i)).length;
      return { text: `${matches} of ${round.items.length} the same.`, tone: "between" };
    }
    case "write": {
      const pct = averagePct(reveal.texts.filter((t) => t.slot !== "self").map((t) => t.matchPct));
      const word = vibeWord(pct);
      if (!word) return { text: "Two takes.", tone: "between" };
      return { text: word, tone: pct! >= VIBE.same ? "match" : pct! >= VIBE.close ? "between" : "miss" };
    }
  }
}
