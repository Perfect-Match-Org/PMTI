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
        <div key={i} className="flex flex-col gap-1">
          <p>{t(item.text)}</p>
          <Choices
            label={t(item.text)}
            options={["Me", partnerName]}
            value={picks[i] ?? null}
            onChange={setAt(setPicks, i)}
            columns={2}
          />
        </div>
      ));
      if (round.items.every((_, i) => picks[i] != null)) {
        answer = { picks: round.items.map((_, i) => picks[i]!) };
      }
      break;
    case "scale": {
      const dots = Array.from({ length: round.steps }, (_, i) => String(i + 1));
      body = (
        <>
          <div className="flex justify-between gap-4 text-sm">
            <span>← {t(round.left)}</span>
            <span className="text-right">{t(round.right)} →</span>
          </div>
          <Choices label="Where you are" options={dots} value={picks[0] ?? null} onChange={setAt(setPicks, 0)} columns={7} />
          <p className="text-sm">Where&apos;s {partnerName}?</p>
          <Choices label={`Where ${partnerName} is`} options={dots} value={guess} onChange={setGuess} columns={7} />
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
              columns={2}
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
        <label key={i} className="flex flex-col gap-1">
          <span>{t(prompt)}</span>
          <input
            value={texts[i] ?? ""}
            maxLength={MAX_TEXT_LENGTH}
            onChange={(e) => setAt(setTexts, i)(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>
      ));
      const filled = prompts.map((_, i) => (texts[i] ?? "").trim());
      if (filled.every(Boolean)) answer = { texts: filled };
      break;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {round.format !== "write" && <h2 className="text-xl font-semibold">{t(title)}</h2>}
      {body}
      <button
        type="button"
        disabled={!answer || busy}
        onClick={() => answer && onSubmit(answer)}
        className="rounded bg-black px-4 py-3 text-white disabled:opacity-40"
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
  return <p className="text-sm">{left > 0 ? `${left}s, go with your gut` : "Time! (it still counts)"}</p>;
}
