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

export function Reveal({ round, reveal, names, t }: Props) {
  const label = (options: Option[], i: number | null | undefined) =>
    i == null ? "(skipped)" : t(options[i]!.label);
  const pick = (seat: Seat, item = 0) => reveal[seat].picks?.[item];

  switch (round.format) {
    case "pick":
    case "agree": {
      const same = pick("host") === pick("guest");
      return (
        <Lines
          rows={[
            [names.host, label(round.options, pick("host"))],
            [names.guest, label(round.options, pick("guest"))],
          ]}
          verdict={same ? "Same brain." : "Two different answers."}
        />
      );
    }
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      const hit = pick(subject) === pick(guesser);
      return (
        <Lines
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
        <ul className="flex flex-col gap-3">
          {round.items.map((item, i) => {
            const named = (seat: Seat) => (pick(seat, i) === 0 ? seat : other(seat));
            const host = named("host");
            const guest = named("guest");
            return (
              <li key={i}>
                <p>{t(item.text)}</p>
                <p className="text-sm">
                  {names.host} says {names[host]} · {names.guest} says {names[guest]}
                  {host === guest ? " · Undisputed." : ""}
                </p>
              </li>
            );
          })}
        </ul>
      );
    case "scale": {
      const at = (seat: Seat) => (pick(seat) ?? 0) + 1;
      const guessed = (seat: Seat) => (reveal[seat].guesses?.[0] ?? 0) + 1;
      return (
        <Lines
          rows={[
            [names.host, `${at("host")} (guessed ${names.guest} at ${guessed("host")})`],
            [names.guest, `${at("guest")} (guessed ${names.host} at ${guessed("guest")})`],
          ]}
          verdict={`On a scale from “${t(round.left)}” (1) to “${t(round.right)}” (${round.steps}).`}
        />
      );
    }
    case "speed": {
      const matches = round.items.filter((_, i) => pick("host", i) != null && pick("host", i) === pick("guest", i)).length;
      return (
        <div className="flex flex-col gap-2">
          {round.items.map((pair, i) => (
            <p key={i} className="text-sm">
              {names.host}: {label(pair, pick("host", i))} · {names.guest}: {label(pair, pick("guest", i))}
            </p>
          ))}
          <p className="font-semibold">
            You matched on {matches}/{round.items.length}.
          </p>
        </div>
      );
    }
    case "write": {
      const textOf = (seat: Seat, slot: ViewText["slot"]) =>
        reveal.texts.find((x) => x.seat === seat && x.slot === slot);
      const rows: [string, string][] =
        round.variant === "mirror"
          ? (["host", "guest"] as const).flatMap((seat): [string, string][] => [
              [`${names[seat]} on ${names[seat]}`, textOf(seat, "self")?.body ?? ""],
              [`${names[other(seat)]} on ${names[seat]}`, textOf(other(seat), "partner")?.body ?? ""],
            ])
          : [
              [names.host, textOf("host", "shared")?.body ?? ""],
              [names.guest, textOf("guest", "shared")?.body ?? ""],
            ];
      return <Lines rows={rows} />;
    }
  }
}

function Lines({ rows, verdict }: { rows: [string, string][]; verdict?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([who, what], i) => (
        <p key={i}>
          <span className="font-semibold">{who}:</span> {what}
        </p>
      ))}
      {verdict && <p className="text-lg font-semibold">{verdict}</p>}
    </div>
  );
}
