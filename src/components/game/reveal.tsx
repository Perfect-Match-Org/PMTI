"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/client/motion";
import { promptFor, whoFor } from "@/game/copy";
import type { Round } from "@/game/deck";
import type { RevealData } from "@/game/engine";
import { verdictFor, type Tone } from "@/game/verdicts";
import { Portal } from "@/components/ui/portal";
import { ActionBar } from "./action-bar";
import { RevealBody } from "./reveal-body";
import { useRoomContext } from "./room-context";
import { Stage } from "./stage";
import { TONE_BG, TONE_TEXT } from "./tones";

const FLASH_MS = 1100;
/** Content starts arriving as the flash clears. */
const AFTER_FLASH = FLASH_MS / 1000 - 0.15;

export function Reveal({ round, reveal }: { round: Round; reveal: RevealData }) {
  const { view, seat, partnerSeat, names, t, busy, act, send } = useRoomContext();
  const reduce = usePrefersReducedMotion();
  const delay = reduce ? 0 : AFTER_FLASH;
  const who = whoFor(seat, names);
  const progress = view.progress;
  const verdict = verdictFor(round, reveal, seat, who, view.tries.length + 1);

  const players = { host: view.players.host, guest: view.players.guest! };
  const body = <RevealBody round={round} reveal={reveal} viewer={seat} players={players} names={names} who={who} t={t} delay={delay} />;

  return (
    <Stage
      aside={
        <>
          {!reduce && <Flash text={verdict.text} tone={verdict.tone} />}
          <p className="text-[0.95rem] font-bold text-navy">{round.scene.time}</p>
          <p className="text-[0.95rem] font-medium text-muted">{t(round.scene.title)}</p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 420, damping: 20 }}
            className="mt-3 origin-left text-[2.1rem] leading-[1.02] font-black tracking-[-0.02em] text-balance lg:mt-4 lg:text-[3.5rem] lg:leading-[0.98]"
          >
            {verdict.text}
          </motion.h1>
        </>
      }
    >
      <p className="-mt-1 text-lg leading-snug font-medium text-balance text-muted lg:mt-0">{t(promptFor(round, seat))}</p>
      <div className="mt-3">{body}</div>
      <ActionBar
        primary={
          view.mine.ready
            ? { label: `Waiting for ${names[partnerSeat]}`, disabled: true }
            : {
                label: "Next",
                disabled: busy,
                onClick: () => act(() => send({ round: progress.phase === "reveal" ? progress.round : 0, attempt: 0, kind: "ready" })),
              }
        }
      />
    </Stage>
  );
}

/**
 * The Wrapped moment: one bold color takes the whole screen, the verdict springs in, then it
 * clears. The color bursts out of the action button, where the press that caused it happened.
 */
function Flash({ text, tone }: { text: string; tone: Tone }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setShow(false), FLASH_MS);
    return () => clearTimeout(id);
  }, []);
  return (
    <Portal>
      <AnimatePresence>
        {show && (
          <Burst key="flash" className={TONE_BG[tone]} color={TONE_TEXT[tone]} onClick={() => setShow(false)}>
            <motion.p
              initial={{ scale: 0.5, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 320, damping: 13 }}
              className="max-w-md text-center text-[clamp(2.75rem,13vw,4.75rem)] leading-[0.95] font-black tracking-[-0.03em] text-balance lg:max-w-4xl lg:text-[7rem]"
            >
              {text}
            </motion.p>
          </Burst>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/** A full-screen layer that opens as a circle from the action button (measured once it's on screen). */
function Burst({ className, color, onClick, children }: { className: string; color: string; onClick: () => void; children: React.ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  useLayoutEffect(() => {
    const r = document.querySelector("[data-primary-action]")?.getBoundingClientRect();
    const at = r ? `${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px` : "50% 90%";
    animate(scope.current, { clipPath: [`circle(0% at ${at})`, `circle(150% at ${at})`] }, { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] });
  }, [animate, scope]);
  return (
    <motion.div
      ref={scope}
      className={`fixed inset-0 z-30 grid place-items-center px-6 ${className}`}
      style={{ clipPath: "circle(0% at 50% 90%)", color }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
