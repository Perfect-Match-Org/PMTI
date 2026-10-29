import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PmLogo } from "@/components/ui/pm-logo";
import { SAMPLE_NAMES } from "@/components/ui/sample-couple";

// The image renderer can't read CSS variables or the woff2 that next/font serves, hence hex values and .ttf files.
const NAVY = "#24438d";
const INK = "#1a2550";
const PINK = "#ffc8e3";
const CARNELIAN = "#b31b1b";
const RED = "#f30020";
const HEART = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z";

const font = (weight: 700 | 900) => readFile(join(process.cwd(), `assets/fonts/Gabarito-${weight}.ttf`));

/**
 * The link preview: the landing's poster in one frame, the headline beside a match card from the
 * deck, with who's inviting when there's someone to name.
 */
export async function shareImage(inviter?: string) {
  const [bold, black] = await Promise.all([font(700), font(900)]);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "space-between", background: NAVY, color: "white", fontFamily: "Gabarito", padding: "52px 72px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <PmLogo gap={NAVY} width={66} height={46} style={{ color: "white" }} />
          <div style={{ width: 3, height: 32, borderRadius: 2, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ fontSize: 30, fontWeight: 900 }}>PMTI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          {inviter && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, fontSize: 38, fontWeight: 700, color: PINK }}>
              <div style={{ display: "flex", width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", background: PINK, color: INK, fontSize: 26, fontWeight: 900 }}>
                {inviter.charAt(0).toUpperCase()}
              </div>
              {`${inviter} invited you`}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 112, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em" }}>
            <span>A Cornell day</span>
            <span>for two.</span>
          </div>
        </div>
      </div>
      <Deck />
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

function Deck() {
  const card = { position: "absolute", top: 0, left: 0, width: 390, height: 474, borderRadius: 38 } as const;
  return (
    <div style={{ display: "flex", position: "relative", width: 390, height: 474, marginTop: 26, marginRight: -6 }}>
      <div style={{ ...card, background: "#bcc6dd", transform: "translate(-10px, -26px) rotate(-4deg) scale(0.92)" }} />
      <div style={{ ...card, background: "#dfe4ef", transform: "translate(10px, -14px) rotate(3deg) scale(0.96)" }} />
      <div style={{ ...card, display: "flex", flexDirection: "column", padding: 32, background: CARNELIAN }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>8:40am</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>Tonight’s 7:30 prelim just got moved to next week.</div>
        <div style={{ marginTop: "auto", fontSize: 58, fontWeight: 900, letterSpacing: "-0.03em" }}>Same brain.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, padding: "14px 16px", borderRadius: 18, background: "white", color: INK }}>
          <div style={{ flex: 1, fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>CTB bagels, then a slow walk down to the Commons</div>
          <Face letter={SAMPLE_NAMES.host.charAt(0)} fill={NAVY} color="white" />
          <div style={{ display: "flex", marginLeft: -16 }}>
            <Face letter={SAMPLE_NAMES.guest.charAt(0)} fill={PINK} color={INK} />
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill={RED} d={HEART} />
          </svg>
        </div>
        {["Map out the rest of the week", "Run up Libe Slope. Because you can."].map((text) => (
          <div key={text} style={{ marginTop: 8, padding: "14px 16px", borderRadius: 18, background: "rgba(255,255,255,0.15)", fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Face({ letter, fill, color }: { letter: string; fill: string; color: string }) {
  return (
    <div style={{ display: "flex", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", background: fill, color, fontSize: 14, fontWeight: 900, border: "3px solid white" }}>
      {letter}
    </div>
  );
}
