"use client";

import Link from "next/link";
import type { Axis, Copy } from "@/game/deck";
import { getDeck } from "@/game/decks";
import type { Pair, RoomView, Seat } from "@/game/engine";
import { momentText } from "@/game/moments";
import type { Result } from "@/game/scoring";
import { duoType } from "@/game/types";

const AXIS_ENDS: Record<Axis, [string, string]> = {
  E: ["Out", "In"],
  P: ["Plan", "Wing"],
  H: ["Say it", "Show it"],
};

type Props = { result: Result; view: RoomView; names: Pair<string>; t: (copy: Copy) => string };

export function ResultView({ result, view, names, t }: Props) {
  const type = duoType(result.type);
  const deck = getDeck(view.deckId);
  if (!type || !deck) return <p>Your result is from an older version of the game.</p>;
  const me = view.seat;
  const partner: Seat = me === "host" ? "guest" : "host";
  const mine = type.halves[result.roles[me]];
  const theirs = type.halves[result.roles[partner]];
  const runnerUp = result.runnerUp ? duoType(result.runnerUp) : undefined;
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm uppercase tracking-wide opacity-60">
          {view.mode === "friends" ? "In a parallel universe where you two date, you'd be" : "Your duo type"}
        </p>
        <h1 className="text-3xl font-bold">{type.name}</h1>
        <p className="text-lg">{type.nickname}</p>
        <p className="italic">{type.tagline}</p>
      </div>

      <ul className="flex flex-col gap-2">
        <li>
          <strong>You&apos;re {mine.name}</strong>: {mine.line}.
        </li>
        <li>
          <strong>
            {names[partner]} is {theirs.name}
          </strong>
          : {theirs.line}.
        </li>
      </ul>

      <dl className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded border p-3">
          <dt className="text-sm">Same Brain</dt>
          <dd className="text-2xl font-bold">{pct(result.sameBrain)}</dd>
        </div>
        <div className="rounded border p-3">
          <dt className="text-sm">Mind Reading</dt>
          <dd className="text-2xl font-bold">{pct(result.mindReading)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3" aria-label="Where you each sit">
        {(Object.keys(AXIS_ENDS) as Axis[]).map((axis) => (
          <AxisBar key={axis} axis={axis} values={result.axes} names={names} me={me} />
        ))}
      </div>

      {runnerUp && <p className="text-sm">With a streak of {runnerUp.name}.</p>}

      {result.moments.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Moments</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {result.moments.map((m, i) => (
              <li key={i}>{momentText(m, { deck, names, t })}</li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/" className="rounded bg-black px-4 py-3 text-center text-white">
        Play again
      </Link>
    </section>
  );
}

function AxisBar({ axis, values, names, me }: { axis: Axis; values: Result["axes"]; names: Pair<string>; me: Seat }) {
  const [left, right] = AXIS_ENDS[axis];
  const at = (v: number) => `${((1 - v) / 2) * 100}%`;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {/* One lane per player, so identical answers never hide a dot. */}
      <div className="relative h-10 rounded bg-neutral-100">
        {(["host", "guest"] as const).map((seat) => (
          <span
            key={seat}
            title={names[seat]}
            className={`absolute -translate-x-1/2 rounded-full px-1.5 text-xs text-white ${seat === "host" ? "top-1" : "bottom-1"} ${seat === me ? "bg-black" : "bg-neutral-500"}`}
            style={{ left: at(values[seat][axis]) }}
          >
            {names[seat].charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );
}
