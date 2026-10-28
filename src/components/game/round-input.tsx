"use client";

import { useEffect, useState } from "react";
import type { Answer } from "@/game/answers";
import { MAX_TEXT_LENGTH, type Copy, type Round } from "@/game/deck";
import type { Seat } from "@/game/engine";
import { Choices } from "./choices";

type Props = {
  round: Round;
  seat: Seat;
  partnerName: string;
  t: (copy: Copy) => string;
  busy: boolean;
  onSubmit: (answer: Answer) => void;
};

export function RoundInput({ round, seat, partnerName, t, busy, onSubmit }: Props) {
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [guess, setGuess] = useState<number | null>(null);
  const [texts, setTexts] = useState<string[]>([]);
  const setAt = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number) => (v: T) =>
    set((prev) => Object.assign([...prev], { [i]: v }));

  const title = round.format === "mind" && round.subject !== seat ? round.guessPrompt : round.prompt;
  let body: React.ReactNode;
  let answer: Answer | null = null;

  switch (round.format) {
    case "pick":
    case "agree":
    case "mind":
      body = (
        <Choices
          label={t(title)}
          options={round.options.map((o) => t(o.label))}
          value={picks[0] ?? null}
          onChange={setAt(setPicks, 0)}
        />
      );
      if (picks[0] != null) answer = { picks: [picks[0]] };
      break;
    case "likely":
      body = round.items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2">
          <p className="font-medium">{t(item.text)}</p>
          <Choices
            label={t(item.text)}
            options={["Me", partnerName]}
            value={picks[i] ?? null}
            onChange={setAt(setPicks, i)}
            layout="pair"
          />
        </div>
      ));
      if (round.items.every((_, i) => picks[i] != null)) {
        answer = { picks: round.items.map((_, i) => picks[i]!) };
      }
      break;
    case "scale": {
      const dots = Array.from({ length: round.steps }, (_, i) => String(i + 1));
      const ends = (
        <div className="flex justify-between gap-6 text-sm">
          <span>1 = {t(round.left)}</span>
          <span className="text-right">{round.steps} = {t(round.right)}</span>
        </div>
      );
      body = (
        <>
          {ends}
          <div className="flex flex-col gap-2">
            <p className="font-medium">You</p>
            <Choices label="Where you are" options={dots} value={picks[0] ?? null} onChange={setAt(setPicks, 0)} layout="scale" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium">Where&apos;s {partnerName}?</p>
            <Choices label={`Where ${partnerName} is`} options={dots} value={guess} onChange={setGuess} layout="scale" />
          </div>
        </>
      );
      if (picks[0] != null && guess != null) answer = { picks: [picks[0]], guesses: [guess] };
      break;
    }
    case "speed":
      body = (
        <>
          <Countdown seconds={round.seconds} />
          {round.items.map((pair, i) => (
            <Choices
              key={i}
              label={`Pair ${i + 1}`}
              options={pair.map((o) => t(o.label))}
              value={picks[i] ?? null}
              onChange={setAt(setPicks, i)}
              layout="pair"
            />
          ))}
        </>
      );
      if (picks.some((p) => p != null)) answer = { picks: round.items.map((_, i) => picks[i] ?? null) };
      break;
    case "write": {
      const prompts =
        round.variant === "mirror" ? [round.prompt, round.partnerPrompt ?? round.prompt] : [round.prompt];
      body = prompts.map((prompt, i) => (
        <label key={i} className="flex flex-col gap-2">
          <span className="text-lg font-semibold">{t(prompt)}</span>
          <input
            value={texts[i] ?? ""}
            maxLength={MAX_TEXT_LENGTH}
            onChange={(e) => setAt(setTexts, i)(e.target.value)}
            className="field"
          />
        </label>
      ));
      const filled = prompts.map((_, i) => (texts[i] ?? "").trim());
      if (filled.every(Boolean)) answer = { texts: filled };
      break;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4">
        {round.format !== "write" && <h2 className="text-lg leading-snug font-semibold">{t(title)}</h2>}
        {body}
      </div>
      <button
        type="button"
        disabled={!answer || busy}
        onClick={() => answer && onSubmit(answer)}
        className="btn self-start"
      >
        {busy ? "Locking in…" : "Lock in"}
      </button>
    </div>
  );
}

/** Visual only: the round never cuts anyone off, so it stays usable for everyone. */
function Countdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-pm-sky">
        <div className="h-full bg-pm-red transition-[width] duration-1000 ease-linear" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <span className="w-24 text-right text-sm font-medium">{left > 0 ? `${left}s, gut only` : "Time! It still counts"}</span>
    </div>
  );
}
