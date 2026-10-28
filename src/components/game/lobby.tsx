"use client";

import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { getDeck } from "@/game/decks";
import { LOBBY_ROUND } from "@/game/engine";
import { Avatar } from "@/components/ui/avatar";
import { ActionBar } from "./action-bar";
import { useRoomContext } from "./room-context";

export function Lobby({ link }: { link: string }) {
  const { view, seat, partnerSeat, names, t, busy, act, send, post } = useRoomContext();
  const [copied, setCopied] = useState(false);
  const guest = view.players.guest;
  const deck = getDeck(view.deckId);

  if (!guest) {
    return (
      <div className="pt-8">
        <h1 className="text-[2.4rem] leading-[1] font-black tracking-[-0.025em] text-balance">
          Get {view.mode === "couple" ? "your partner" : "your friend"} in.
        </h1>
        <p className="mt-3 text-lg text-muted">They scan this with their phone camera.</p>
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-7 grid place-items-center"
        >
          <QRCodeSVG value={link} size={232} marginSize={0} fgColor="#1a2550" title={`QR code that opens ${link}`} />
        </motion.div>
        <p className="mt-7 text-center text-lg text-balance">
          Or they enter code <b className="font-black tracking-[0.08em] text-navy">{view.code}</b> on the home page.
        </p>
        <ActionBar
          reactions={false}
          primary={{
            label: copied ? "Link copied" : "Copy invite link",
            onClick: async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            },
          }}
        />
      </div>
    );
  }

  const partner = view.players[partnerSeat]!;
  return (
    <div className="pt-8">
      <div className="flex items-center">
        <motion.span initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <Avatar player={view.players[seat]!} tone="me" size={64} />
        </motion.span>
        <motion.span
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.08 }}
          className="-ml-3 rounded-full ring-4 ring-white"
        >
          <Avatar player={partner} tone="partner" size={64} />
        </motion.span>
      </div>
      <h1 className="mt-5 text-[2.6rem] leading-[1] font-black tracking-[-0.025em]">
        {names.host} &amp; {names.guest} are in.
      </h1>
      {deck && <p className="mt-4 text-xl leading-snug text-muted">{t(deck.intro)}</p>}
      {seat === "host" && (
        <button type="button" onClick={() => act(() => post("kick"))} className="mt-6 font-semibold text-muted underline underline-offset-4">
          Not who you invited? Remove {partner.name}
        </button>
      )}
      <ActionBar
        primary={
          view.mine.ready
            ? { label: `Waiting for ${partner.name}`, disabled: true }
            : { label: "I’m ready", disabled: busy, onClick: () => act(() => send({ round: LOBBY_ROUND, attempt: 0, kind: "ready" })) }
        }
      />
    </div>
  );
}
