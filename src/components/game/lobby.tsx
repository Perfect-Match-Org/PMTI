"use client";

import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { BRAND } from "@/brand";
import { useCopy } from "@/client/useCopy";
import { LOBBY_ROUND, type PlayerInfo } from "@/game/engine";
import { Avatar } from "@/components/ui/avatar";
import { Heart } from "@/components/ui/heart";
import { ActionBar } from "./action-bar";
import { useRoomContext } from "./room-context";
import { Stage } from "./stage";

export function Lobby({ link }: { link: string }) {
  const { view, deck, seat, partnerSeat, names, t, busy, act, send, post } = useRoomContext();
  const invite = useCopy();
  const guest = view.players.guest;

  if (!guest) {
    const orCode = (
      <>
        Or they enter code <b className="font-black tracking-[0.08em] text-navy">{view.code}</b> on the home page.
      </>
    );
    return (
      <Stage
        aside={
          <>
            <h1 className="text-[2.4rem] leading-[1] font-black tracking-[-0.025em] text-balance lg:text-[3.5rem]">
              Get {view.mode === "couple" ? "your partner" : "your friend"} in.
            </h1>
            <p className="mt-3 text-lg text-muted">They scan this with their phone camera.</p>
            <p className="mt-8 hidden text-xl text-balance lg:block">{orCode}</p>
          </>
        }
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="mt-1 grid place-items-center lg:mt-0 lg:place-items-start"
        >
          <div className="lg:rounded-[2rem] lg:bg-tile lg:p-10">
            <QRCodeSVG value={link} size={232} marginSize={0} fgColor={BRAND.ink} title={`QR code that opens ${link}`} className="lg:size-80" />
          </div>
        </motion.div>
        <p className="mt-7 text-center text-lg text-balance lg:hidden">{orCode}</p>
        <ActionBar
          reactions={false}
          primary={{
            label: invite.state === "copied" ? "Link copied" : invite.state === "failed" ? "Couldn’t copy: use the code" : "Copy invite link",
            onClick: () => invite.copy(link),
          }}
        />
      </Stage>
    );
  }

  const me = view.players[seat]!;
  const partner = view.players[partnerSeat]!;
  return (
    <Stage
      aside={
        <>
          <div className="flex items-center">
            <motion.span initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Avatar player={me} tone="me" size={64} />
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
          <h1 className="mt-5 text-[2.6rem] leading-[1] font-black tracking-[-0.025em] text-balance lg:text-[3.5rem]">
            {names.host} &amp; {names.guest} are in.
          </h1>
          <p className="mt-4 text-xl leading-snug text-muted">{t(deck.intro)}</p>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        <ReadyRow player={me} tone="me" label="You" ready={view.mine.ready} />
        <ReadyRow player={partner} tone="partner" label={partner.name} ready={view.partner.ready} />
      </div>
      {seat === "host" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => act(() => post("kick", { version: view.version }, { showConflict: true }))}
          className="mt-6 font-semibold text-muted underline underline-offset-4"
        >
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
    </Stage>
  );
}

/** One player's line in the lobby: turns pink with a heart the moment they're ready. */
function ReadyRow({ player, tone, label, ready }: { player: PlayerInfo; tone: "me" | "partner"; label: string; ready: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-[1.125rem] px-4 py-3 transition-colors duration-300 ${ready ? "bg-blush" : "bg-tile"}`}>
      <Avatar player={player} tone={tone} size={36} />
      <span className="flex-1 text-lg font-bold">{label}</span>
      {ready ? (
        <motion.span
          key="ready"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 16 }}
          className="flex items-center gap-1.5 font-bold text-red"
        >
          <Heart size={18} />
          Ready
        </motion.span>
      ) : (
        <span className="font-medium text-muted">Not yet</span>
      )}
    </div>
  );
}
