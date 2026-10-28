"use client";

import type { Answer } from "@/game/answers";
import type { Copy, Option, Round } from "@/game/deck";
import type { Pair, Seat, ViewText } from "@/game/engine";

type Props = {
  round: Round;
  reveal: Pair<Answer> & { texts: ViewText[] };
  names: Pair<string>;
  t: (copy: Copy) => string;
};

const other = (seat: Seat): Seat => (seat === "host" ? "guest" : "host");

/** Embedding similarity catches shared vibe/topic, not meaning (it can't tell "early" from "late"). */
const vibe = (pct: number | null | undefined) => (pct == null ? undefined : `${pct}% vibe match`);

export function Reveal({ round, reveal, names, t }: Props) {
  const label = (options: Option[], i: number | null | undefined) =>
    i == null ? "(skipped)" : t(options[i]!.label);
  const pick = (seat: Seat, item = 0) => reveal[seat].picks?.[item];

  switch (round.format) {
    case "pick":
    case "agree":
      return (
        <Answers
          rows={[
            [names.host, label(round.options, pick("host"))],
            [names.guest, label(round.options, pick("guest"))],
          ]}
          verdict={pick("host") === pick("guest") ? "Same brain." : "Two different answers."}
        />
      );
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      const hit = pick(subject) === pick(guesser);
      return (
        <Answers
          rows={[
            [`${names[subject]} picked`, label(round.options, pick(subject))],
            [`${names[guesser]} guessed`, label(round.options, pick(guesser))],
          ]}
          verdict={hit ? `${names[guesser]} has ${names[subject]} figured out.` : "Not quite. Noted."}
        />
      );
    }
    case "likely":
      return (
        <div className="flex flex-col gap-3">
          {round.items.map((item, i) => {
            const named = (seat: Seat) => (pick(seat, i) === 0 ? seat : other(seat));
            const agreed = named("host") === named("guest");
            return (
              <div key={i} className="card reveal-in" style={tilt(i)}>
                <p className="font-medium">{t(item.text)}</p>
                <p className="mt-2 text-lg font-semibold">
                  {agreed
                    ? `${names[named("host")]}, undisputed.`
                    : `${names.host} says ${names[named("host")]}. ${names.guest} says ${names[named("guest")]}.`}
                </p>
              </div>
            );
          })}
        </div>
      );
    case "scale": {
      const at = (seat: Seat) => pick(seat) ?? 0;
      const guessed = (seat: Seat) => reveal[seat].guesses?.[0] ?? 0;
      return (
        <div className="card reveal-in flex flex-col gap-4">
          {(["host", "guest"] as const).map((seat) => {
            const nailed = guessed(other(seat)) === at(seat);
            return (
              <div key={seat} className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold">
                  {names[seat]}
                  {nailed ? `, and ${names[other(seat)]} nailed it` : ""}
                </p>
                <ScaleRow steps={round.steps} self={at(seat)} guess={guessed(other(seat))} />
              </div>
            );
          })}
          <div className="flex justify-between gap-6 text-sm">
            <span>{t(round.left)}</span>
            <span className="text-right">{t(round.right)}</span>
          </div>
          <p className="text-sm">Solid dot: where each of you stands. Red ring: where the other one guessed.</p>
        </div>
      );
    }
    case "speed": {
      const matches = round.items.filter((_, i) => pick("host", i) != null && pick("host", i) === pick("guest", i)).length;
      return (
        <div className="flex flex-col gap-3">
          <div className="card reveal-in flex flex-col gap-2">
            {round.items.map((pair, i) => {
              const same = pick("host", i) != null && pick("host", i) === pick("guest", i);
              return (
                <p key={i} className={same ? "font-semibold" : ""}>
                  {same
                    ? `Both: ${label(pair, pick("host", i))}`
                    : `${names.host}: ${label(pair, pick("host", i))}. ${names.guest}: ${label(pair, pick("guest", i))}.`}
                </p>
              );
            })}
          </div>
          <Verdict text={`${matches} of ${round.items.length} the same.`} />
        </div>
      );
    }
    case "write": {
      const textOf = (seat: Seat, slot: ViewText["slot"]) => reveal.texts.find((x) => x.seat === seat && x.slot === slot);
      if (round.variant === "mirror") {
        return (
          <div className="flex flex-col gap-6">
            {(["host", "guest"] as const).map((seat) => {
              const guess = textOf(other(seat), "partner");
              return (
                <Answers
                  key={seat}
                  rows={[
                    [`${names[seat]} said`, textOf(seat, "self")?.body ?? ""],
                    [`${names[other(seat)]} guessed`, guess?.body ?? ""],
                  ]}
                  verdict={vibe(guess?.matchPct)}
                />
              );
            })}
          </div>
        );
      }
      const host = textOf("host", "shared");
      const guest = textOf("guest", "shared");
      const scores = [host?.matchPct, guest?.matchPct].filter((p): p is number => p != null);
      return (
        <Answers
          rows={[
            [names.host, host?.body ?? ""],
            [names.guest, guest?.body ?? ""],
          ]}
          verdict={vibe(scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null)}
        />
      );
    }
  }
}

const tilt = (i: number): React.CSSProperties =>
  ({ "--tilt": i % 2 ? "2.5deg" : "-2.5deg", animationDelay: `${i * 90}ms` }) as React.CSSProperties;

function Answers({ rows, verdict }: { rows: [string, string][]; verdict?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map(([who, what], i) => (
        <div key={i} className="card reveal-in" style={tilt(i)}>
          <p className="text-sm font-semibold">{who}</p>
          <p className="mt-1 text-lg leading-snug font-medium">{what}</p>
        </div>
      ))}
      {verdict && <Verdict text={verdict} delay={rows.length * 90} />}
    </div>
  );
}

function Verdict({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <p className="reveal-in font-display text-3xl leading-tight text-[var(--clock)]" style={{ animationDelay: `${delay}ms` }}>
      {text}
    </p>
  );
}

function ScaleRow({ steps, self, guess }: { steps: number; self: number; guess: number }) {
  return (
    <div className="grid grid-cols-7 gap-1" aria-hidden>
      {Array.from({ length: steps }, (_, i) => (
        <span key={i} className="relative flex h-8 items-center justify-center rounded-full bg-pm-sky/70">
          {i === self && <span className="size-4 rounded-full bg-pm-blue" />}
          {i === guess && <span className="absolute size-7 rounded-full border-[3px] border-pm-red" />}
        </span>
      ))}
    </div>
  );
}
