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
  P: ["Plan", "Wing it"],
  H: ["Say it", "Show it"],
};

type Props = { result: Result; view: RoomView; names: Pair<string>; t: (copy: Copy) => string };

export function ResultView({ result, view, names, t }: Props) {
  const type = duoType(result.type);
  const deck = getDeck(view.deckId);
  if (!type || !deck) return <p>Your result is from an older version of the game.</p>;
  const me = view.seat;
  const partner: Seat = me === "host" ? "guest" : "host";
  const runnerUp = result.runnerUp ? duoType(result.runnerUp) : undefined;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  // Break before "&" / "vs." so the ampersand starts the second line instead of dangling.
  const [first, ...rest] = type.name.split(/\s(?=&|vs\.)/);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-xl">
          {view.mode === "friends" ? "That's the day. In a parallel universe where you two date, you'd be" : "That's the day. You two are"}
        </p>
        <h1 className="font-display text-[clamp(2.25rem,10.5vw,3.75rem)] leading-[0.95] text-balance text-[var(--clock)]">
          {first}
          {rest.length > 0 && (
            <>
              {" "}
              <br />
            </>
          )}
          {rest.join(" ")}
        </h1>
        <p className="text-2xl font-semibold">{type.nickname}</p>
        <p className="text-lg leading-snug">{type.tagline}</p>
      </div>

      <Ticket
        top={{ who: "You're", ...type.halves[result.roles[me]] }}
        bottom={{ who: `${names[partner]} is`, ...type.halves[result.roles[partner]] }}
      />

      <dl className="grid grid-cols-2 gap-4">
        {[
          ["Same Brain", result.sameBrain, "How often you answered alike"],
          ["Mind Reading", result.mindReading, "How well you guessed each other"],
        ].map(([label, value, hint]) => (
          <div key={label as string} className="flex flex-col">
            <dd className="font-display text-5xl leading-none">{pct(value as number)}</dd>
            <dt className="mt-2 font-semibold">{label as string}</dt>
            <p className="text-sm leading-snug">{hint as string}</p>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-4" aria-label="Where you each sit">
        {(Object.keys(AXIS_ENDS) as Axis[]).map((axis) => (
          <AxisBar key={axis} axis={axis} values={result.axes} names={names} me={me} />
        ))}
        {runnerUp && <p>With a streak of {runnerUp.name}.</p>}
      </div>

      {result.moments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl">Moments</h2>
          <ul className="flex flex-col gap-3">
            {result.moments.map((m, i) => (
              <li key={i} className="border-l-4 border-[var(--clock)] pl-3 text-lg leading-snug">
                {momentText(m, { deck, names, t })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/" className="btn self-start">
        Play again
      </Link>
    </section>
  );
}

type Half = { who: string; name: string; line: string };

/** A duo type is literally two halves: one ticket, torn along the perforation. */
function Ticket({ top, bottom }: { top: Half; bottom: Half }) {
  const half = (h: Half) => (
    <div className="px-5 py-4">
      <p>
        <span className="block font-semibold">{h.who}</span>{" "}
        <span className="block font-display text-3xl leading-tight">{h.name}</span>
      </p>
      <p className="mt-1 leading-snug">{h.line}.</p>
    </div>
  );
  return (
    <div className="relative rounded-2xl bg-white text-pm-blue">
      {half(top)}
      <div className="relative mx-5 border-t-2 border-dashed border-pm-blue" aria-hidden>
        <span className="absolute -top-3 -left-8 size-6 rounded-full bg-[var(--bg)]" />
        <span className="absolute -top-3 -right-8 size-6 rounded-full bg-[var(--bg)]" />
      </div>
      {half(bottom)}
    </div>
  );
}

function AxisBar({ axis, values, names, me }: { axis: Axis; values: Result["axes"]; names: Pair<string>; me: Seat }) {
  const [left, right] = AXIS_ENDS[axis];
  const at = (v: number) => `${((1 - v) / 2) * 100}%`;
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {/* One lane per player, so identical answers never hide a dot. */}
      <div className="relative mt-1 h-13 rounded-full border-2 border-[var(--line)]">
        {(["host", "guest"] as const).map((seat) => (
          <span
            key={seat}
            title={names[seat]}
            className={`absolute -translate-x-1/2 rounded-full px-2 text-xs leading-5 font-bold ${seat === "host" ? "top-0.5" : "bottom-0.5"} ${seat === me ? "bg-[var(--clock)] text-pm-night" : "bg-white text-pm-blue"}`}
            style={{ left: `clamp(14px, ${at(values[seat][axis])}, calc(100% - 14px))` }}
          >
            {names[seat].charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );
}
