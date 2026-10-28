"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { RoomView } from "@/game/engine";

type Props = {
  view: RoomView;
  link: string;
  intro: string;
  busy: boolean;
  onReady: () => void;
  onKick: () => void;
};

export function Lobby({ view, link, intro, busy, onReady, onKick }: Props) {
  const [copied, setCopied] = useState(false);
  const guest = view.players.guest;
  const partnerWord = view.mode === "couple" ? "your partner" : "your friend";

  if (!guest) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-lg font-medium">Your game code</p>
          <p className="font-display text-[clamp(2.5rem,13vw,4rem)] leading-none tracking-[0.04em] text-pm-red">
            {view.code}
          </p>
        </div>
        <div className="card flex flex-col items-center gap-4">
          <QRCodeSVG value={link} size={196} marginSize={1} fgColor="#24438d" title={`QR code that opens ${link}`} />
          <p className="text-center">Have {partnerWord} scan this with their phone camera.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Link copied" : "Copy invite link"}
          </button>
          <span className="text-sm">Waiting for them to join…</span>
        </div>
      </div>
    );
  }

  const partnerName = view.seat === "host" ? guest.name : view.players.host.name;
  return (
    <div className="flex flex-col gap-6">
      <p className="font-display text-[clamp(2.5rem,13vw,3.75rem)] leading-[0.95]">
        {view.players.host.name} &amp; {guest.name} are in.
      </p>
      <p className="text-xl leading-snug">{intro}</p>
      {view.mine.ready ? (
        <p className="font-medium">You&apos;re ready. Waiting for {partnerName}…</p>
      ) : (
        <button type="button" disabled={busy} onClick={onReady} className="btn btn-solid self-start">
          I&apos;m ready
        </button>
      )}
      {view.seat === "host" && (
        <button type="button" onClick={onKick} className="btn-quiet self-start text-sm">
          Not who you invited? Remove {guest.name}
        </button>
      )}
    </div>
  );
}
