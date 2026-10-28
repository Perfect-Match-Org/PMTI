import type { Axis, Deck, Weights } from "./deck";
import { walk, type MoveRow, type Pair, type RoomFacts, type Seat, type TextRow } from "./engine";
import { REACTIONS, type Reaction } from "./reactions";
import { DUO_TYPES, type DuoType, type RoleMetric } from "./types";

export const SCORER_VERSION = 1;

/** Tuned with the simulation test so every type lands roughly between 4% and 15% of games. */
export const THRESHOLDS = {
  dreamTeam: { sameBrain: 0.7, mindReading: 0.7 },
  prelims: { mindReading: 0.6 },
  competitors: { claims: 0.66 },
  oppositeGap: 0.85,
  reactionsMoment: 10,
};

/** "Who's more likely" is someone else's read of you, so it counts half as much as self-report. */
const LIKELY_WEIGHT = 0.5;

const AXES: Axis[] = ["E", "P", "H"];
const SEATS: Seat[] = ["host", "guest"];
export type Vec = Record<Axis, number>;

export type Moment =
  | { kind: "same-pick"; round: number; option: number }
  | { kind: "mind"; round: number; guesser: Seat; hit: boolean; guess: number; actual: number }
  | { kind: "undisputed"; round: number; item: number; who: Seat }
  | { kind: "denial"; round: number; item: number }
  | { kind: "both-claim"; round: number; item: number }
  | { kind: "dinner"; round: number; tries: number; failed: boolean; caved: Seat | null }
  | { kind: "close-call"; round: number; guesser: Seat }
  | { kind: "mirror"; round: number; about: Seat; pct: number }
  | { kind: "reactions"; round: number; who: Seat; emoji: Reaction; count: number };

export type Result = {
  scorerVersion: number;
  type: string;
  runnerUp: string | null;
  /** Index into the type's `halves` for each player. */
  roles: Pair<0 | 1>;
  axes: Pair<Vec>;
  sameBrain: number;
  mindReading: number;
  features: { center: Vec; gap: Vec; friction: number; claims: number; switches: Pair<number> };
  moments: Moment[];
};

const zero = (): Vec => ({ E: 0, P: 0, H: 0 });
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round3 = (x: number) => Math.round(x * 1000) / 1000;
const mapVec = (f: (a: Axis) => number): Vec => ({ E: round3(f("E")), P: round3(f("P")), H: round3(f("H")) });
const other = (seat: Seat): Seat => (seat === "host" ? "guest" : "host");

/** Largest |weight| per axis among the choices on offer: the most a single answer could move you. */
function reach(choices: (Weights | undefined)[], scale = 1): Vec {
  return mapVec((a) => Math.max(0, ...choices.map((w) => Math.abs(w?.[a] ?? 0))) * scale);
}

/** Sum of nudges over sum of possible nudges, per axis, so every player lands in [-1, 1]. */
class AxisTally {
  private sum = zero();
  private max = zero();
  add(w: Weights | undefined, possible: Vec, scale = 1) {
    for (const a of AXES) {
      this.sum[a] += (w?.[a] ?? 0) * scale;
      this.max[a] += possible[a];
    }
  }
  value(): Vec {
    return mapVec((a) => (this.max[a] ? this.sum[a] / this.max[a] : 0));
  }
}

export function score(
  deck: Deck,
  room: RoomFacts & { guestId: string },
  moves: MoveRow[],
  texts: TextRow[]
): Result {
  const ids: Pair<string> = { host: room.hostId, guest: room.guestId };
  const seatOf = (playerId: string): Seat | null =>
    playerId === ids.host ? "host" : playerId === ids.guest ? "guest" : null;
  const answers = new Map(
    moves.filter((m) => m.kind === "answer").map((m) => [`${m.playerId}|${m.round}|${m.attempt}`, m.payload])
  );
  const answer = (seat: Seat, round: number, attempt = 0) => answers.get(`${ids[seat]}|${round}|${attempt}`);

  const tally: Pair<AxisTally> = { host: new AxisTally(), guest: new AxisTally() };
  const same: number[] = [];
  const mind: Pair<number[]> = { host: [], guest: [] };
  const switches: Pair<number> = { host: 0, guest: 0 };
  let brags = 0;
  let bothClaimed = 0;
  let agree: { tries: number; maxTries: number; failed: boolean } | null = null;
  const candidates: { interest: number; moment: Moment }[] = [];
  const note = (interest: number, moment: Moment) => candidates.push({ interest, moment });

  for (const { index: r, attempts, matched } of walk(deck, room, moves).played) {
    const round = deck.rounds[r]!;
    const pick = (seat: Seat, item = 0, attempt = 0) => answer(seat, r, attempt)?.picks?.[item] ?? null;

    switch (round.format) {
      case "pick": {
        const possible = reach(round.options.map((o) => o.w));
        for (const s of SEATS) {
          const p = pick(s);
          if (p != null) tally[s].add(round.options[p]?.w, possible);
        }
        same.push(matched ? 1 : 0);
        if (matched) note(1, { kind: "same-pick", round: r, option: pick("host")! });
        break;
      }
      case "mind": {
        const subject = round.subject;
        const guesser = other(subject);
        const actual = pick(subject);
        const guess = pick(guesser);
        if (actual == null || guess == null) break;
        tally[subject].add(round.options[actual]?.w, reach(round.options.map((o) => o.w)));
        const hit = actual === guess;
        mind[guesser].push(hit ? 1 : 0);
        note(hit ? 2 : 2.5, { kind: "mind", round: r, guesser, hit, guess, actual });
        break;
      }
      case "likely":
        round.items.forEach((item, i) => {
          const possible = reach([item.nudge], LIKELY_WEIGHT);
          const target = (voter: Seat): Seat | null => {
            const p = pick(voter, i);
            return p == null ? null : p === 0 ? voter : other(voter);
          };
          for (const voter of SEATS) {
            for (const s of SEATS) tally[s].add(target(voter) === s ? item.nudge : undefined, possible, LIKELY_WEIGHT);
          }
          const byHost = target("host");
          const byGuest = target("guest");
          same.push(byHost === byGuest ? 1 : 0);
          const claimed = pick("host", i) === 0 && pick("guest", i) === 0;
          if (item.brag) {
            brags++;
            if (claimed) bothClaimed++;
          }
          if (claimed && item.brag) note(2.5, { kind: "both-claim", round: r, item: i });
          else if (byHost && byHost === byGuest) note(2, { kind: "undisputed", round: r, item: i, who: byHost });
          else if (pick("host", i) === 1 && pick("guest", i) === 1) note(3, { kind: "denial", round: r, item: i });
        });
        break;
      case "scale": {
        const span = round.steps - 1;
        const possible = { ...zero(), [round.axis]: Math.abs(round.leftWeight) };
        const self = (s: Seat) => pick(s);
        for (const s of SEATS) {
          const v = self(s);
          if (v != null) tally[s].add({ [round.axis]: round.leftWeight * (1 - (2 * v) / span) }, possible);
        }
        const h = self("host");
        const g = self("guest");
        if (h != null && g != null) same.push(1 - Math.abs(h - g) / span);
        for (const s of SEATS) {
          const guess = answer(s, r)?.guesses?.[0];
          const actual = self(other(s));
          if (guess == null || actual == null) continue;
          mind[s].push(1 - Math.abs(guess - actual) / span);
          if (guess === actual) note(1.5, { kind: "close-call", round: r, guesser: s });
        }
        break;
      }
      case "agree": {
        same.push(pick("host", 0, 0) === pick("guest", 0, 0) ? 1 : 0);
        let caved: Seat | null = null;
        for (let a = 0; a + 1 < attempts; a++) {
          const moved = SEATS.filter((s) => pick(s, 0, a + 1) !== pick(s, 0, a));
          for (const s of moved) switches[s]++;
          if (caved === null && moved.length === 1) caved = moved[0]!;
        }
        agree = { tries: attempts, maxTries: round.tries, failed: !matched };
        note(!matched ? 3 : attempts > 1 ? 2.5 : 1.5, { kind: "dinner", round: r, tries: attempts, failed: !matched, caved });
        break;
      }
      case "speed": {
        round.items.forEach((pair, i) => {
          const possible = reach(pair.map((o) => o.w));
          for (const s of SEATS) {
            const p = pick(s, i);
            if (p != null) tally[s].add(pair[p]?.w, possible);
          }
          const h = pick("host", i);
          const g = pick("guest", i);
          if (h != null && g != null) same.push(h === g ? 1 : 0);
        });
        break;
      }
      case "write": {
        const rowsOf = (s: Seat, slot: TextRow["slot"]) =>
          texts.find((t) => t.round === r && t.playerId === ids[s] && t.slot === slot);
        if (round.variant === "mirror") {
          for (const s of SEATS) {
            const pct = rowsOf(s, "partner")?.matchPct;
            if (pct == null) continue;
            mind[s].push(pct / 100);
            note(2 + pct / 100, { kind: "mirror", round: r, about: other(s), pct });
          }
        } else {
          const pcts = SEATS.map((s) => rowsOf(s, "shared")?.matchPct).filter((p): p is number => p != null);
          if (pcts.length) same.push(mean(pcts) / 100);
        }
        break;
      }
    }
  }

  for (const m of moves) {
    const who = seatOf(m.playerId);
    if (m.kind !== "ready" || !who || !m.payload.reactions) continue;
    for (const emoji of REACTIONS) {
      const count = m.payload.reactions[emoji] ?? 0;
      if (count >= THRESHOLDS.reactionsMoment) {
        note(2 + Math.min(count, 50) / 50, { kind: "reactions", round: m.round, who, emoji, count });
      }
    }
  }

  const axes = { host: tally.host.value(), guest: tally.guest.value() };
  const center = mapVec((a) => (axes.host[a] + axes.guest[a]) / 2);
  const gap = mapVec((a) => Math.abs(axes.host[a] - axes.guest[a]));
  const a = agree;
  const friction = a ? (a.failed ? 1 : (a.tries - 1) / a.maxTries) : 0;
  const features = { center, gap, friction: round3(friction), claims: round3(brags ? bothClaimed / brags : 0), switches };
  const sameBrain = round3(mean(same));
  const mindReading = round3(mean([...mind.host, ...mind.guest]));

  const { type, runnerUp } = chooseType({
    center,
    gap,
    sameBrain,
    mindReading,
    claims: features.claims,
    friction: features.friction,
    hardAgree: !!a && (a.failed || a.tries >= a.maxTries),
  });

  const metric = (seat: Seat, by: RoleMetric) =>
    by === "sharper" ? mean(mind[seat]) : by === "steadier" ? -switches[seat] : axes[seat][by];
  const hostHigher = metric("host", type.role.by) >= metric("guest", type.role.by);
  const high = type.role.higherGets;
  const low = (1 - high) as 0 | 1;

  return {
    scorerVersion: SCORER_VERSION,
    type: type.id,
    runnerUp: runnerUp?.id ?? null,
    roles: hostHigher ? { host: high, guest: low } : { host: low, guest: high },
    axes,
    sameBrain,
    mindReading,
    features,
    moments: pickMoments(candidates),
  };
}

type Features = {
  center: Vec;
  gap: Vec;
  sameBrain: number;
  mindReading: number;
  claims: number;
  friction: number;
  hardAgree: boolean;
};

/** Ordered rules: earned types, then a big gap on one axis, then the corner the duo leans toward. */
export function chooseType(f: Features): { type: DuoType; runnerUp: DuoType | null } {
  const byId = (id: string) => DUO_TYPES.find((t) => t.id === id)!;
  const cornerOf = (flip?: Axis) =>
    DUO_TYPES.find(
      (t) => t.kind === "corner" && AXES.every((a) => t.lean[a] === ((flip === a ? -f.center[a] : f.center[a]) >= 0 ? 1 : -1))
    )!;
  const corner = cornerOf();
  const t = THRESHOLDS;

  if (f.sameBrain >= t.dreamTeam.sameBrain && f.mindReading >= t.dreamTeam.mindReading) {
    return { type: byId("founders"), runnerUp: corner };
  }
  if (f.hardAgree && f.mindReading < t.prelims.mindReading) return { type: byId("prelims-finals"), runnerUp: corner };
  if (f.claims >= t.competitors.claims && f.friction > 0 && f.center.E > 0) {
    return { type: byId("cornell-harvard"), runnerUp: corner };
  }

  const widest = AXES.reduce((x, y) => (f.gap[y] > f.gap[x] ? y : x));
  if (f.gap[widest] >= t.oppositeGap) {
    return { type: DUO_TYPES.find((d) => d.kind === "opposite" && d.axis === widest)!, runnerUp: corner };
  }
  const weakest = AXES.reduce((x, y) => (Math.abs(f.center[y]) < Math.abs(f.center[x]) ? y : x));
  return { type: corner, runnerUp: cornerOf(weakest) };
}

/** The three most interesting moments, at most one of each kind. */
function pickMoments(candidates: { interest: number; moment: Moment }[]): Moment[] {
  const seen = new Set<string>();
  const picked: Moment[] = [];
  for (const { moment } of [...candidates].sort((x, y) => y.interest - x.interest)) {
    if (seen.has(moment.kind)) continue;
    seen.add(moment.kind);
    picked.push(moment);
    if (picked.length === 3) break;
  }
  return picked;
}
