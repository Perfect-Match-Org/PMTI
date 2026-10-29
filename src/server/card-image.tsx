import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/brand";
import { duoType, splitPair } from "@/game/types";
import { PmLogo } from "@/components/ui/pm-logo";
import type { Card } from "./rooms";

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

/** The line above the pair's name: both names only when both players chose to show them. */
export function cardLead(card: Card): string {
  const [a, b] = card.people;
  const who = a.name && b.name ? `${a.name} & ${b.name} are` : "We’re";
  return card.mode === "friends" ? `In a parallel universe, ${who.charAt(0).toLowerCase()}${who.slice(1)}` : who;
}

export const CARD_SIZES = { wide: { width: 1200, height: 630 }, story: { width: 1080, height: 1920 } } as const;

/**
 * The share card as an image: `wide` is the link preview, `story` the tall one to save for a story.
 * Names appear only for players who chose to show them; otherwise their circle stays empty.
 */
export async function cardImage(card: Card, format: keyof typeof CARD_SIZES, site: string) {
  const type = duoType(card.typeId);
  if (!type) return new Response("Not found", { status: 404 });
  const [bold, black, serif] = await Promise.all([font("Gabarito-700.ttf"), font("Gabarito-900.ttf"), font("BodoniModa-Italic-500.ttf")]);
  const story = format === "story";
  const s = (wide: number, tall: number) => (story ? tall : wide);
  const { first, joiner, second } = splitPair(type.name);
  const mind = Math.round(card.mindReading * 100);
  const width = s(640, 888);

  // Each half once: the place, its role under it, and the person's name beside it only if they show it.
  const halves = (
    <div style={{ display: "flex", flexDirection: "column", gap: s(18, 40), width }}>
      {type.halves.map((half, i) => {
        const person = card.people[i]!;
        return (
          // Tall: pills line up on the right. Wide: each sits right after its place, so it doesn't drift off.
          <div key={i} style={{ display: "flex", justifyContent: story ? "space-between" : "flex-start", alignItems: "flex-start", gap: s(20, 28), width }}>
            <div style={{ display: "flex", flexDirection: "column", flexShrink: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: s(12, 22), fontSize: s(52, 100), fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
                {i === 1 && joiner && (
                  <span style={joiner === "&" ? { fontFamily: "Bodoni", fontWeight: 500, letterSpacing: 0 } : { fontSize: "0.8em", fontWeight: 700 }}>{joiner}</span>
                )}
                <span>{i === 0 ? (second ? first : type.name) : (second ?? "")}</span>
              </div>
              <div style={{ marginTop: s(6, 14), fontSize: s(20, 34), fontWeight: 700, lineHeight: 1.3, color: "rgba(255,255,255,0.65)" }}>{half.line}</div>
            </div>
            {person.name && (
              <div
                style={{
                  display: "flex",
                  flexShrink: 0,
                  alignItems: "center",
                  gap: s(10, 16),
                  marginTop: s(8, 16),
                  padding: story ? "10px 28px 10px 10px" : "6px 16px 6px 6px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  fontSize: s(20, 34),
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: s(30, 52),
                    height: s(30, 52),
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    background: person.seat === "host" ? BRAND.navy : BRAND.pink,
                    color: person.seat === "host" ? BRAND.white : BRAND.ink,
                    fontSize: s(15, 26),
                    fontWeight: 900,
                  }}
                >
                  {person.name.charAt(0).toUpperCase()}
                </div>
                {person.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  const mindReading = (
    <div style={{ display: "flex", alignItems: "baseline", gap: s(12, 20) }}>
      <span style={{ fontSize: s(64, 150), fontWeight: 900, letterSpacing: "-0.04em", color: BRAND.pink }}>{`${mind}%`}</span>
      <span style={{ fontSize: s(22, 40), fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>mind reading</span>
    </div>
  );
  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: s(16, 24) }}>
      <PmLogo gap={BRAND.ink} width={s(58, 96)} height={s(41, 67)} style={{ color: BRAND.white }} />
      <div style={{ width: 3, height: s(28, 44), borderRadius: 2, background: "rgba(255,255,255,0.25)" }} />
      <div style={{ fontSize: s(26, 42), fontWeight: 900 }}>PMTI</div>
    </div>
  );
  const lead = <div style={{ fontSize: s(26, 44), fontWeight: 700, color: BRAND.pink, marginBottom: s(14, 28) }}>{cardLead(card)}</div>;
  const nickname = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: s(30, 50), fontWeight: 700, color: BRAND.pink }}>{type.nickname}</div>
      <div style={{ marginTop: s(6, 10), fontSize: s(22, 38), fontWeight: 700, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>{type.tagline}</div>
    </div>
  );

  return new ImageResponse(
    story ? (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BRAND.ink, color: BRAND.white, fontFamily: "Gabarito", padding: 96 }}>
        {brand}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ fontSize: 34, fontWeight: 900 }}>11:58pm</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 72 }}>That’s the day.</div>
          {lead}
          {halves}
          <div style={{ display: "flex", marginTop: 64 }}>{nickname}</div>
          <div style={{ display: "flex", marginTop: 64 }}>{mindReading}</div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{`Find out which two you are at ${site}`}</div>
      </div>
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "space-between", background: BRAND.ink, color: BRAND.white, fontFamily: "Gabarito", padding: "52px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          {brand}
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            {lead}
            {halves}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 360, justifyContent: "space-between" }}>
          {mindReading}
          {nickname}
        </div>
      </div>
    ),
    {
      ...CARD_SIZES[format],
      // Never cached: a player can take their name off the card at any time.
      headers: { "cache-control": "no-store" },
      fonts: [
        { name: "Gabarito", data: bold, weight: 700, style: "normal" },
        { name: "Gabarito", data: black, weight: 900, style: "normal" },
        { name: "Bodoni", data: serif, weight: 500, style: "normal" },
      ],
    }
  );
}
