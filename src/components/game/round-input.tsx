"use client";

import { useEffect, useState } from "react";
import type { Answer } from "@/game/answers";
import { promptFor } from "@/game/copy";
import { MAX_TEXT_LENGTH, type Round } from "@/game/deck";
import type { TextSlot } from "@/game/engine";
import { ActionBar } from "./action-bar";
import { Choices, ScaleEnds } from "./choices";
import { useRoomContext } from "./room-context";

const SLOT_ORDER: TextSlot[] = ["self", "partner", "shared"];

export function RoundInput({ round }: { round: Round }) {
  const { view, seat, partnerSeat, names, t, busy, act, send } = useRoomContext();
  const progress = view.progress;
  const locked = view.mine.answer;
  const lockedTexts = [...view.mine.texts].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  const [picks, setPicks] = useState<(number | null)[]>(() => locked?.picks ?? []);
  const [guess, setGuess] = useState<number | null>(() => locked?.guesses?.[0] ?? null);
  const [texts, setTexts] = useState<string[]>(() => lockedTexts.map((x) => x.body));
  const setAt = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number) => (v: T) =>
    set((prev) => Object.assign([...prev], { [i]: v }));
  const partnerName = names[partnerSeat];

  const title = promptFor(round, seat);
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
          disabled={!!locked}
        />
      );
      if (picks[0] != null) answer = { picks: [picks[0]] };
      break;
    case "likely":
      body = (
        <div className="flex flex-col gap-5">
          {round.items.map((item, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <p className="text-lg font-semibold">{t(item.text)}</p>
              <Choices
                label={t(item.text)}
                options={["Me", partnerName]}
                value={picks[i] ?? null}
                onChange={setAt(setPicks, i)}
                disabled={!!locked}
                layout="pair"
              />
            </div>
          ))}
        </div>
      );
      if (round.items.every((_, i) => picks[i] != null)) answer = { picks: round.items.map((_, i) => picks[i]!) };
      break;
    case "scale": {
      const dots = Array.from({ length: round.steps }, (_, i) => String(i + 1));
      const ends = <ScaleEnds left={t(round.left)} right={t(round.right)} />;
      body = (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <p className="text-lg font-semibold">You</p>
            <Choices label="Where you are" options={dots} value={picks[0] ?? null} onChange={setAt(setPicks, 0)} disabled={!!locked} layout="scale" />
            {ends}
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-lg font-semibold">Where’s {partnerName}?</p>
            <Choices label={`Where ${partnerName} is`} options={dots} value={guess} onChange={setGuess} disabled={!!locked} layout="scale" />
            {ends}
          </div>
        </div>
      );
      if (picks[0] != null && guess != null) answer = { picks: [picks[0]], guesses: [guess] };
      break;
    }
    case "speed":
      body = (
        <div className="flex flex-col gap-4">
          {!locked && <Countdown seconds={round.seconds} />}
          {round.items.map((pair, i) => (
            <Choices
              key={i}
              label={`Pair ${i + 1}`}
              options={pair.map((o) => t(o.label))}
              value={picks[i] ?? null}
              onChange={setAt(setPicks, i)}
              disabled={!!locked}
              layout="pair"
            />
          ))}
        </div>
      );
      if (picks.some((p) => p != null)) answer = { picks: round.items.map((_, i) => picks[i] ?? null) };
      break;
    case "write": {
      const prompts = round.variant === "mirror" ? [round.prompt, round.partnerPrompt ?? round.prompt] : [round.prompt];
      body = (
        <div className="flex flex-col gap-5">
          {prompts.map((prompt, i) => (
            <label key={i} className="flex flex-col gap-2.5">
              <span className={i === 0 ? "sr-only" : "text-lg font-semibold"}>{t(prompt)}</span>
              <input
                value={texts[i] ?? ""}
                maxLength={MAX_TEXT_LENGTH}
                disabled={!!locked}
                placeholder={i === 0 ? "Your answer" : `Your guess for ${partnerName}`}
                onChange={(e) => setAt(setTexts, i)(e.target.value)}
                className="field"
              />
            </label>
          ))}
        </div>
      );
      const filled = prompts.map((_, i) => (texts[i] ?? "").trim());
      if (filled.every(Boolean)) answer = { texts: filled };
      break;
    }
  }

  const attempt = progress.phase === "answer" ? progress.attempt : 0;
  const lastTry = view.tries.at(-1);
  return (
    <div className="pt-6">
      <p className="text-[0.95rem] font-bold text-navy">{round.scene.time}</p>
      <p className="text-[0.95rem] font-medium text-muted">{t(round.scene.title)}</p>
      {lastTry && round.format === "agree" && (
        <p className="mt-4 rounded-2xl bg-blush px-4 py-3 font-semibold">
          Not the same yet. {names.host} picked “{t(round.options[lastTry.host.picks?.[0] ?? 0]!.label)}”, {names.guest} picked “
          {t(round.options[lastTry.guest.picks?.[0] ?? 0]!.label)}”. Try {attempt + 1} of {round.tries}.
        </p>
      )}
      <h1 className="mt-3 text-[1.9rem] leading-[1.08] font-extrabold tracking-[-0.015em] text-balance">{t(title)}</h1>
      <div className="mt-6">{body}</div>
      <ActionBar
        primary={
          locked
            ? { label: `Waiting for ${partnerName}`, disabled: true }
            : {
                label: busy ? "Locking in…" : "Lock in",
                disabled: !answer || busy,
                onClick: () => answer && act(() => send({ round: progress.phase === "answer" ? progress.round : 0, attempt, kind: "answer", payload: answer })),
              }
        }
      />
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
    <div className="mb-1 flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-tile">
        <div className="h-full rounded-full bg-red transition-[width] duration-1000 ease-linear" style={{ width: `${(left / seconds) * 100}%` }} />
      </div>
      <span className="w-20 text-right text-sm font-semibold text-muted">{left > 0 ? `${left}s, gut only` : "Time!"}</span>
    </div>
  );
}
