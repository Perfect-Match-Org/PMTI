"use client";

import { motion } from "motion/react";
import { REACTION_LABELS, REACTIONS } from "@/game/reactions";
import { Portal } from "@/components/ui/portal";
import { useRoomContext } from "./room-context";

type Action = { label: string; onClick?: () => void; disabled?: boolean };

/**
 * The one place the main action lives, pinned to the bottom of every screen so your thumb never
 * has to look for it. Screens pass their action; the bar looks and sits the same everywhere.
 */
export function ActionBar({ primary, secondary, reactions = true }: { primary: Action; secondary?: Action; reactions?: boolean }) {
  const { react } = useRoomContext();
  return (
    <Portal>
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {reactions && (
            <div role="toolbar" aria-label="Reactions" className="flex justify-around">
              {REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  type="button"
                  aria-label={`Send ${REACTION_LABELS[emoji]}`}
                  onClick={() => react(emoji)}
                  whileTap={{ scale: 1.35, rotate: -8 }}
                  transition={{ type: "spring", stiffness: 600, damping: 15 }}
                  className="p-1.5 text-[1.6rem] leading-none"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            {secondary && (
              <button type="button" onClick={secondary.onClick} disabled={secondary.disabled} className="btn btn-secondary flex-none">
                {secondary.label}
              </button>
            )}
            <button type="button" onClick={primary.onClick} disabled={primary.disabled} className="btn btn-primary flex-1">
              {primary.label}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
