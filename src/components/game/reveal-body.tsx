"use client";

import { motion } from "motion/react";
import type { Who } from "@/game/copy";
import type { Copy, Option, Round } from "@/game/deck";
import { other, type Pair, type PlayerInfo, type RevealData, type Seat, type ViewText } from "@/game/engine";
import { averagePct, likelyItem, namedBy, vibeWord } from "@/game/verdicts";
import { Avatar } from "@/components/ui/avatar";
import { Heart } from "@/components/ui/heart";
import { Rise } from "@/components/ui/rise";
import { TypingDots } from "@/components/ui/typing-dots";
import { ScaleEnds } from "./choices";

export type RevealBodyProps = {
  round: Round;
  reveal: RevealData;
  /** Whose phone this is ("you"), or null for the landing's sample couple, where both are named. */
  viewer: Seat | null;
  players: Pair<PlayerInfo>;
  names: Pair<string>;
  who: Who;
  t: (copy: Copy) => string;
  /** The landing card: smaller type, and no entrance of its own (the card already moves). */
  compact?: boolean;
  /** Seconds before the answers arrive (the game waits for its verdict flash). */
  delay?: number;
  /** False while the picks are still secret: the options show, the faces don't. */
  landed?: boolean;
  /** The verdict color fills what's behind: chosen answers go white over it, the rest fade into it. */
  wash?: boolean;
  /** layoutId prefix: each player's own face flies in from wherever it was before (the landing's seats). */
  fly?: string;
};

type Ctx = Required<Omit<RevealBodyProps, "fly">> & {
  fly?: string;
  order: Seat[];
  /** Seats whose face has already taken the fly id in this render: only the first face of each flies. */
  flown: Set<Seat>;
};

/**
 * Both players' answers to a round, the same for every kind of round on the game's reveal screen and
 * on the landing's sample cards: faces land on what each person picked, and a shared pick gets a heart.
 */
export function RevealBody(props: RevealBodyProps) {
  const { round, reveal, viewer } = props;
  const ctx: Ctx = {
    compact: false,
    delay: 0,
    landed: true,
    wash: false,
    ...props,
    order: viewer ? [viewer, other(viewer)] : ["host", "guest"],
    flown: new Set(),
  };
  const pick = (s: Seat, item = 0) => reveal[s].picks?.[item];

  switch (round.format) {
    case "pick":
    case "agree":
      return <Rows ctx={ctx} options={round.options} marks={ctx.order.map((seat) => ({ seat, at: pick(seat) }))} />;
    case "mind": {
      const subject = round.subject;
      const guesser = other(subject);
      const own = (s: Seat) => (s === viewer ? "Your" : `${ctx.names[s]}’s`);
      return (
        <Rows
          ctx={ctx}
          options={round.options}
          marks={[
            { seat: subject, at: pick(subject), caption: `${own(subject)} pick` },
            { seat: guesser, at: pick(guesser), caption: `${own(guesser)} guess` },
          ]}
        />
      );
    }
    case "likely":
      return <Likely ctx={ctx} items={round.items} pick={pick} />;
    case "scale":
      return <Scale ctx={ctx} round={round} reveal={reveal} />;
    case "speed":
      return <Speed ctx={ctx} items={round.items} pick={pick} />;
    case "write":
      return <Write ctx={ctx} mirror={round.variant === "mirror"} texts={reveal.texts} />;
  }
}

/** A tile's fill: plain while secret; once landed, pink for a shared pick, gray for one, an outline for none. */
function fill(ctx: Ctx, marked: boolean, both: boolean) {
  if (ctx.wash) return marked ? "border-transparent bg-white text-ink" : "border-transparent bg-white/15";
  if (!ctx.landed) return "border-transparent bg-tile";
  return both ? "border-transparent bg-blush" : marked ? "border-transparent bg-tile" : "border-tile";
}

/** Text no one picked steps back once the answers are in. */
const quiet = (ctx: Ctx, marked: boolean) => (ctx.landed && !marked ? (ctx.wash ? "opacity-80" : "text-muted/70") : "");

/** An item of the reveal: rises in on the game page; on the landing card it's simply there. */
function Item({ ctx, at, className, children }: { ctx: Ctx; at: number; className: string; children: React.ReactNode }) {
  // Hold the tint until faces flying in from their seats have arrived.
  const tint = ctx.fly && ctx.landed && !ctx.wash ? "delay-300" : "";
  const cls = `border-2 transition-colors duration-300 ${tint} ${className}`;
  if (ctx.compact) return <div className={cls}>{children}</div>;
  return (
    <Rise as="div" delay={ctx.delay + at} className={cls}>
      {children}
    </Rise>
  );
}

type Mark = { seat: Seat; at: number | null | undefined; caption?: string };

/** Every option, in the question's order, with each face on the one that person chose. */
function Rows({ ctx, options, marks }: { ctx: Ctx; options: Option[]; marks: Mark[] }) {
  return (
    <div className={`flex flex-col ${ctx.compact ? "gap-2" : "gap-2.5"}`}>
      {options.map((option, i) => {
        const here = marks.filter((m) => m.at === i).sort((a, b) => ctx.order.indexOf(a.seat) - ctx.order.indexOf(b.seat));
        const caption = ctx.landed && here.length === 1 ? here[0]!.caption : undefined;
        return (
          <Item
            key={i}
            ctx={ctx}
            at={i * 0.05}
            className={`flex items-center gap-3 px-4 ${ctx.compact ? "min-h-12 rounded-2xl py-2" : "min-h-[3.75rem] rounded-[1.125rem] py-2.5"} ${fill(ctx, here.length > 0, here.length === 2)}`}
          >
            <span
              className={`flex-1 leading-tight ${ctx.compact ? "text-[0.95rem] lg:text-base xl:text-[1.0625rem]" : "text-[1.0625rem]"} ${ctx.landed && here.length ? "font-bold" : "font-medium"} ${quiet(ctx, here.length > 0)}`}
            >
              {ctx.t(option.label)}
            </span>
            {caption && <span className="text-sm font-semibold whitespace-nowrap opacity-70">{caption}</span>}
            <Faces ctx={ctx} seats={here.map((m) => m.seat)} />
          </Item>
        );
      })}
    </div>
  );
}

/** Per item: two name tiles with each face on the person it named, then what that adds up to. */
function Likely({ ctx, items, pick }: { ctx: Ctx; items: { text: Copy }[]; pick: (s: Seat, i: number) => number | null | undefined }) {
  const { who, viewer, order } = ctx;
  const says = (s: Seat) => `${who(s, true)} ${s === viewer ? "say" : "says"}`;
  const [a, b] = order as [Seat, Seat];
  return (
    <div className={`flex flex-col ${ctx.compact ? "gap-3" : "gap-4"}`}>
      {items.map((item, i) => {
        const landed = likelyItem(pick("host", i), pick("guest", i));
        const line =
          landed?.kind === "agreed"
            ? `${who(landed.named, true)}, undisputed.`
            : landed?.kind === "both-claim"
              ? `${viewer ? "You both" : "Both"} claim it.`
              : `${says(a)} ${who(b)}. ${says(b)} ${who(a)}.`;
        return (
          <div key={i}>
            <p className={`leading-snug text-balance ${ctx.compact ? "text-sm font-semibold opacity-75" : "text-muted"}`}>{ctx.t(item.text)}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {order.map((named) => {
                const by = order.filter((voter) => {
                  const p = pick(voter, i);
                  return p != null && namedBy(voter, p) === named;
                });
                return (
                  <Item
                    key={named}
                    ctx={ctx}
                    at={i * 0.08}
                    className={`flex items-center justify-between gap-2 px-3.5 ${ctx.compact ? "min-h-11 rounded-2xl py-1.5" : "min-h-13 rounded-[1.125rem] py-2"} ${fill(ctx, by.length > 0, by.length === 2)}`}
                  >
                    <span className={`min-w-0 truncate font-bold ${quiet(ctx, by.length > 0)}`}>{who(named, true)}</span>
                    <Faces ctx={ctx} seats={by} />
                  </Item>
                );
              })}
            </div>
            {ctx.landed && <p className={`mt-1.5 font-bold ${ctx.compact ? "text-sm" : "text-lg"}`}>{line}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Each person's own spot on the scale, with the other's guess as a smaller face, and how close it was. */
function Scale({ ctx, round, reveal }: { ctx: Ctx; round: Extract<Round, { format: "scale" }>; reveal: RevealData }) {
  const { who, viewer, order } = ctx;
  const spot = (s: Seat) => reveal[s].picks?.[0] ?? 0;
  const guessOf = (s: Seat) => reveal[other(s)].guesses?.[0] ?? 0;
  const dot = ctx.wash ? "bg-white/15" : ctx.compact ? "bg-tile" : "bg-white";
  const body = (
    <>
      {order.map((owner) => {
        const guesser = other(owner);
        const off = Math.abs(guessOf(owner) - spot(owner));
        return (
          <div key={owner} className="flex flex-col gap-1.5">
            <p className={`flex justify-between gap-3 ${ctx.compact ? "text-sm font-semibold" : ""}`}>
              <b className="font-bold">{who(owner, true)}</b>
              <span className={`${ctx.landed ? "" : "invisible"} ${off === 0 ? "font-bold" : "opacity-75"}`}>
                {off === 0 ? `${who(guesser, true)} nailed it` : `${who(guesser, true)} ${guesser === viewer ? "were" : "was"} ${off} off`}
              </span>
            </p>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${round.steps}, 1fr)` }} aria-hidden>
              {Array.from({ length: round.steps }, (_, i) => (
                <span key={i} className={`relative grid aspect-square place-items-center rounded-full transition-colors duration-300 ${dot}`}>
                  {ctx.landed && i === spot(owner) && <Face ctx={ctx} seat={owner} size={ctx.compact ? 26 : 30} at={0} />}
                  {ctx.landed && i === guessOf(owner) && (
                    <span className={i === spot(owner) ? "absolute -right-1 -bottom-1" : ""}>
                      <Face ctx={ctx} seat={guesser} size={i === spot(owner) ? 16 : 20} at={0.1} guess />
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })}
      <ScaleEnds left={ctx.t(round.left)} right={ctx.t(round.right)} />
    </>
  );
  if (ctx.compact) return <div className="flex flex-col gap-3">{body}</div>;
  return (
    <Rise as="div" delay={ctx.delay} className="flex flex-col gap-5 rounded-[1.125rem] bg-tile p-4">
      {body}
    </Rise>
  );
}

/** Rapid pairs: each row's two options, with each face on the side that person took. */
function Speed({ ctx, items, pick }: { ctx: Ctx; items: Option[][]; pick: (s: Seat, i: number) => number | null | undefined }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((pair, i) => {
        const same = pick("host", i) != null && pick("host", i) === pick("guest", i);
        return (
          <Item key={i} ctx={ctx} at={i * 0.06} className={`grid grid-cols-2 gap-2 rounded-2xl p-2 ${same ? "border-transparent bg-blush" : "border-transparent bg-tile"}`}>
            {pair.map((option, j) => {
              const by = ctx.order.filter((s) => pick(s, i) === j);
              return (
                <span key={j} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${by.length ? "bg-white font-bold" : "text-muted"}`}>
                  {ctx.t(option.label)}
                  <span className="flex -space-x-1.5">
                    {by.map((s) => (
                      <Avatar key={s} player={ctx.players[s]} tone={toneOf(ctx, s)} size={20} />
                    ))}
                  </span>
                </span>
              );
            })}
          </Item>
        );
      })}
    </div>
  );
}

type Note = { seat: Seat; caption: string; text: string };

/** Free text: what each person wrote, side by side, and how close it came. */
function Write({ ctx, mirror, texts }: { ctx: Ctx; mirror: boolean; texts: ViewText[] }) {
  const { who, order } = ctx;
  const textOf = (s: Seat, slot: ViewText["slot"]) => texts.find((x) => x.seat === s && x.slot === slot);
  const pairs: { notes: [Note, Note]; pct: number | null | undefined }[] = mirror
    ? order
        .filter((s) => textOf(s, "self") || textOf(other(s), "partner"))
        .map((s) => {
          const guess = textOf(other(s), "partner");
          return {
            notes: [
              { seat: s, caption: `${who(s, true)} said`, text: textOf(s, "self")?.body ?? "" },
              { seat: other(s), caption: `${who(other(s), true)} guessed`, text: guess?.body ?? "" },
            ],
            pct: guess?.matchPct,
          };
        })
    : [
        {
          notes: order.map((s) => ({ seat: s, caption: who(s, true), text: textOf(s, "shared")?.body ?? "" })) as [Note, Note],
          pct: averagePct(order.map((s) => textOf(s, "shared")?.matchPct)),
        },
      ];
  return (
    <div className={`flex flex-col ${ctx.compact ? "gap-3" : "gap-7"}`}>
      {pairs.map(({ notes, pct }, k) => (
        <div key={k}>
          <div className="grid grid-cols-2 gap-2.5">
            {notes.map((note, i) => (
              <motion.div
                key={note.seat}
                initial={ctx.compact ? false : { opacity: 0, x: i ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ctx.delay, type: "spring", stiffness: 300, damping: 24 }}
                className={`flex flex-col gap-2 p-3.5 transition-colors duration-300 lg:p-4 ${ctx.compact ? "rounded-2xl" : "min-h-36 rounded-[1.125rem]"} ${ctx.wash ? "bg-white text-ink" : "bg-tile"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold opacity-75">
                  <Avatar player={ctx.players[note.seat]} tone={toneOf(ctx, note.seat)} size={ctx.compact ? 24 : 32} />
                  {note.caption}
                </span>
                <span className={`leading-snug font-bold wrap-anywhere ${ctx.compact ? "min-h-[5.2em] text-base lg:text-lg" : "text-lg"}`}>
                  {ctx.landed ? (
                    <motion.span className="block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      {note.text}
                    </motion.span>
                  ) : (
                    <TypingDots className="pt-2" />
                  )}
                </span>
              </motion.div>
            ))}
          </div>
          {ctx.landed && <Vibe ctx={ctx} pct={pct} />}
        </div>
      ))}
    </div>
  );
}

function Vibe({ ctx, pct }: { ctx: Ctx; pct: number | null | undefined }) {
  const word = vibeWord(pct);
  if (!word) return null;
  return (
    <Rise as="div" delay={ctx.delay + 0.3} className="mt-2.5 flex items-baseline gap-2">
      <span className={`font-black ${ctx.compact ? "text-base" : "text-xl"}`}>{word}</span>
      <span className="text-sm opacity-70">{pct}% vibe match</span>
    </Rise>
  );
}

/** The viewer's own face is navy and the partner's pink; on the landing, the host is the navy one. */
const toneOf = (ctx: Ctx, s: Seat) => (s === (ctx.viewer ?? "host") ? "me" : "partner");

/** The faces on one answer, landing once the answers are in. Two on the same answer get a heart. */
function Faces({ ctx, seats }: { ctx: Ctx; seats: Seat[] }) {
  if (!ctx.landed || !seats.length) return null;
  return (
    <span className="flex flex-none items-center">
      {seats.map((s, j) => (
        <span key={s} className={j ? "-ml-2 rounded-full ring-[3px] ring-white" : "rounded-full"}>
          <Face ctx={ctx} seat={s} size={ctx.compact ? 28 : 32} at={0.3 + j * 0.1} />
        </span>
      ))}
      {seats.length === 2 && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ delay: ctx.delay + 0.6, duration: 0.45 }} className="ml-2 text-red">
          <Heart size={ctx.compact ? 20 : 22} />
        </motion.span>
      )}
    </span>
  );
}

/**
 * One face. A player's first own face takes the fly id, so it travels from where it last was (a
 * lock-in seat on the landing); every other face pops in where it lands.
 */
function Face({ ctx, seat, size, at, guess = false }: { ctx: Ctx; seat: Seat; size: number; at: number; guess?: boolean }) {
  const flies = !!ctx.fly && !guess && !ctx.flown.has(seat);
  if (flies) ctx.flown.add(seat);
  return (
    <motion.span
      className="block rounded-full"
      layoutId={flies ? `${ctx.fly}-${seat}` : undefined}
      initial={flies ? false : { scale: 0, y: ctx.compact ? -24 : 0 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: ctx.delay + at, type: "spring", stiffness: 500, damping: 16, layout: { type: "spring", stiffness: 260, damping: 26 } }}
    >
      <Avatar player={ctx.players[seat]} tone={toneOf(ctx, seat)} size={size} />
    </motion.span>
  );
}
