import { expect, it } from "vitest";
import type { Answer } from "./answers";
import type { Axis, Option, Round, Weights } from "./deck";
import { CURRENT_DECK } from "./decks";
import type { Seat } from "./engine";
import { score } from "./scoring";
import { play, ROOM } from "./test-utils";
import { DUO_TYPES } from "./types";

/**
 * Plays thousands of simulated couples through the real deck to check the type distribution.
 * A partner is "a copy plus noise" of the other (real couples agree more than random players),
 * at several noise levels from near-identical to opposite. Seeded, so results are stable.
 */
const GAMES = 4000;
const NOISE_LEVELS = [0.15, 0.4, 0.8, 1.3];
const AXES: Axis[] = ["E", "P", "H"];

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Persona = { v: Record<Axis, number>; know: number; claim: number; give: number; taste: number[] };

function simulate(seed: number) {
  const rand = mulberry32(seed);
  const normal = (sd: number) => sd * Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const clamp = (x: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, x));
  const fit = (p: Persona, w: Weights | undefined) => AXES.reduce((sum, a) => sum + p.v[a] * (w?.[a] ?? 0), 0);
  const choose = (p: Persona, options: Option[]) => {
    let best = 0;
    let bestScore = -Infinity;
    options.forEach((o, i) => {
      const s = fit(p, o.w) / 2 - Math.log(-Math.log(rand() || 1e-9)) * 0.6;
      if (s > bestScore) [best, bestScore] = [i, s];
    });
    return best;
  };

  const sigma = NOISE_LEVELS[seed % NOISE_LEVELS.length]!;
  const v = { E: rand() * 2 - 1, P: rand() * 2 - 1, H: rand() * 2 - 1 };
  const know = 0.2 + rand() * 0.75;
  const taste = [rand(), rand(), rand(), rand()];
  const a: Persona = { v, know, claim: rand(), give: rand(), taste };
  const b: Persona = {
    v: { E: clamp(v.E + normal(sigma)), P: clamp(v.P + normal(sigma)), H: clamp(v.H + normal(sigma)) },
    know: clamp(know + normal(0.15), 0, 1),
    claim: rand(),
    give: rand(),
    taste: taste.map((t) => t + normal(sigma / 2)),
  };
  const who: Record<Seat, Persona> = { host: a, guest: b };
  const partner = (s: Seat): Seat => (s === "host" ? "guest" : "host");
  const agreeLog: Record<Seat, number[]> = { host: [], guest: [] };

  const answer = (seat: Seat, round: Round, _index: number, attempt: number): Answer => {
    const me = who[seat];
    const them = who[partner(seat)];
    switch (round.format) {
      case "pick":
        return { picks: [choose(me, round.options)] };
      case "mind":
        return { picks: [choose(round.subject === seat || rand() < me.know ? who[round.subject] : me, round.options)] };
      case "likely":
        return {
          picks: round.items.map((item) => {
            if (item.brag && rand() < me.claim * 0.6) return 0;
            return fit(me, item.nudge) + normal(0.4) >= fit(them, item.nudge) + normal(0.4) ? 0 : 1;
          }),
        };
      case "scale": {
        const span = round.steps - 1;
        const step = (p: Persona, sd: number) =>
          Math.round(clamp(((1 - p.v[round.axis] * Math.sign(round.leftWeight)) / 2) * span + normal(sd), 0, span));
        return { picks: [step(me, 0.7)], guesses: [step(them, 0.7 + (1 - me.know) * 2)] };
      }
      case "agree": {
        let pick: number;
        if (attempt === 0) {
          pick = me.taste.map((t, i) => [t + normal(0.2), i] as const).sort((x, y) => y[0] - x[0])[0]![1];
        } else {
          const last = agreeLog[seat][attempt - 1]!;
          pick = rand() < me.give ? agreeLog[partner(seat)][attempt - 1]! : last;
        }
        agreeLog[seat][attempt] = pick;
        return { picks: [pick] };
      }
      case "speed":
        return { picks: round.items.map((pair) => (rand() < 0.05 ? null : choose(me, pair))) };
      case "write":
        return { texts: round.variant === "mirror" ? ["a", "b"] : ["a"] };
    }
  };

  const log = play(CURRENT_DECK, {
    answer,
    matchPct: (seat, round, slot) => {
      if (slot === "self") return null;
      const base = slot === "partner" ? 0.25 + 0.7 * who[seat].know : 0.9 - sigma * 0.4;
      return Math.round(clamp(base + normal(0.15), 0, 1) * 100);
    },
  });
  return score(CURRENT_DECK, ROOM, log.moves, log.texts);
}

it.skipIf(!process.env.SIM_QUANTILES)("feature quantiles (tuning aid)", () => {
  const rows = Array.from({ length: GAMES }, (_, i) => simulate(i + 1));
  const q = (xs: number[]) => {
    const s = [...xs].sort((x, y) => x - y);
    return [0.5, 0.75, 0.85, 0.9, 0.95].map((p) => s[Math.floor(p * (s.length - 1))]!.toFixed(2)).join("  ");
  };
  console.log("quantiles      p50   p75   p85   p90   p95");
  console.log("sameBrain     ", q(rows.map((r) => r.sameBrain)));
  console.log("mindReading   ", q(rows.map((r) => r.mindReading)));
  console.log("1-mindReading ", q(rows.map((r) => 1 - r.mindReading)));
  console.log("maxGap        ", q(rows.map((r) => Math.max(r.features.gap.E, r.features.gap.P, r.features.gap.H))));
  console.log("claims        ", q(rows.map((r) => r.features.claims)));
  console.log("friction      ", q(rows.map((r) => r.features.friction)));
  const both = rows.filter((r) => r.sameBrain >= 0.7 && r.mindReading >= 0.7).length;
  console.log("sameBrain>=.7 & mind>=.7:", ((both / GAMES) * 100).toFixed(1) + "%");
});

it(`type distribution over ${GAMES} simulated couples`, () => {
  const counts = new Map<string, number>(DUO_TYPES.map((t) => [t.id, 0]));
  for (let seed = 1; seed <= GAMES; seed++) {
    const r = simulate(seed);
    counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
  }
  const share = (id: string) => (counts.get(id) ?? 0) / GAMES;
  console.log(
    DUO_TYPES.map((t) => `${(share(t.id) * 100).toFixed(1).padStart(5)}%  ${t.name}`).join("\n")
  );
  for (const t of DUO_TYPES) {
    expect(share(t.id), t.name).toBeGreaterThanOrEqual(0.04);
    expect(share(t.id), t.name).toBeLessThanOrEqual(0.15);
  }
});
