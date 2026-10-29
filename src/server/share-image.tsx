import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/brand";
import { TONE_FILL, TONE_TEXT } from "@/components/game/tones";
import { BEATS, SAMPLE_NAMES, type Beat, type Body } from "@/components/landing/sample-day";
import { HEART_PATH } from "@/components/ui/heart";
import { PmLogo } from "@/components/ui/pm-logo";

// The image renderer reads neither CSS variables nor the woff2 that next/font serves.
const font = (weight: 700 | 900) => readFile(join(process.cwd(), `assets/fonts/Gabarito-${weight}.ttf`));

/**
 * The link preview: the landing's poster in one frame, the headline beside the deck's first card at
 * its verdict, with who's inviting when there's someone to name.
 */
export async function shareImage(inviter?: string) {
  const [bold, black] = await Promise.all([font(700), font(900)]);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "space-between", background: BRAND.navy, color: BRAND.white, fontFamily: "Gabarito", padding: "52px 72px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <PmLogo gap={BRAND.navy} width={66} height={46} style={{ color: BRAND.white }} />
          <div style={{ width: 3, height: 32, borderRadius: 2, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ fontSize: 30, fontWeight: 900 }}>PMTI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          {inviter && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, fontSize: 38, fontWeight: 700, color: BRAND.pink }}>
              <Face letter={inviter.charAt(0)} fill={BRAND.pink} color={BRAND.ink} size={54} />
              {`${inviter} invited you`}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 112, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em" }}>
            <span>A Cornell day</span>
            <span>for two.</span>
          </div>
        </div>
      </div>
      {PREVIEW_BEAT && <Deck beat={PREVIEW_BEAT} />}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Gabarito", data: bold, weight: 700, style: "normal" },
        { name: "Gabarito", data: black, weight: 900, style: "normal" },
      ],
    }
  );
}

/** The first sample round that floods with color and shows option rows; a deck edit that leaves none just drops the card. */
const PREVIEW_BEAT = BEATS.find((b): b is Beat & { body: Extract<Body, { kind: "rows" }> } => b.body.kind === "rows" && b.tone !== "between");

/** That beat at its verdict: the rows both players landed on first, then the rest. */
function Deck({ beat }: { beat: NonNullable<typeof PREVIEW_BEAT> }) {
  const { rows: labels, marks } = beat.body;
  const rows = labels.map((text, i) => ({ text, both: marks.every((m) => m.at === i) }));
  const shown = [...rows.filter((r) => r.both), ...rows.filter((r) => !r.both)].slice(0, 3);
  const ink = TONE_TEXT[beat.tone];
  const card = { position: "absolute", top: 0, left: 0, width: 390, height: 474, borderRadius: 38 } as const;
  return (
    <div style={{ display: "flex", position: "relative", width: 390, height: 474, marginTop: 26, marginRight: -6 }}>
      <div style={{ ...card, background: "#bcc6dd", transform: "translate(-10px, -26px) rotate(-4deg) scale(0.92)" }} />
      <div style={{ ...card, background: "#dfe4ef", transform: "translate(10px, -14px) rotate(3deg) scale(0.96)" }} />
      <div style={{ ...card, display: "flex", flexDirection: "column", padding: 32, background: TONE_FILL[beat.tone], color: ink }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>{beat.time}</div>
        <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.8, lineHeight: 1.3 }}>{beat.scene}</div>
        <div style={{ marginTop: "auto", fontSize: 58, fontWeight: 900, letterSpacing: "-0.03em" }}>{beat.verdict}</div>
        {shown.map((row, i) =>
          row.both ? (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, padding: "14px 16px", borderRadius: 18, background: BRAND.white, color: BRAND.ink }}>
              <div style={{ flex: 1, fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>{row.text}</div>
              <Face letter={SAMPLE_NAMES.host.charAt(0)} fill={BRAND.navy} color={BRAND.white} ring />
              <div style={{ display: "flex", marginLeft: -16 }}>
                <Face letter={SAMPLE_NAMES.guest.charAt(0)} fill={BRAND.pink} color={BRAND.ink} ring />
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill={BRAND.red} d={HEART_PATH} />
              </svg>
            </div>
          ) : (
            <div key={i} style={{ marginTop: 8, padding: "14px 16px", borderRadius: 18, background: "rgba(255,255,255,0.15)", fontSize: 19, fontWeight: 700, opacity: 0.8 }}>
              {row.text}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Face({ letter, fill, color, size = 32, ring = false }: { letter: string; fill: string; color: string; size?: number; ring?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        background: fill,
        color,
        fontSize: size * 0.45,
        fontWeight: 900,
        border: ring ? `3px solid ${BRAND.white}` : undefined,
      }}
    >
      {letter.toUpperCase()}
    </div>
  );
}
