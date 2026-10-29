import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/brand";
import { duoType } from "@/game/types";
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
  const [first, joiner, second] = type.name.split(/ (&|vs\.) /);
  const mind = Math.round(card.mindReading * 100);

  const name = (
    <div style={{ display: "flex", flexDirection: "column", fontSize: s(64, 116), fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em" }}>
      <span>{second ? first : type.name}</span>
      {second && (
        <div style={{ display: "flex", alignItems: "baseline", gap: s(14, 24) }}>
          <span style={joiner === "&" ? { fontFamily: "Bodoni", fontWeight: 500, letterSpacing: 0 } : { fontSize: "0.8em", fontWeight: 700 }}>{joiner}</span>
          <span>{second}</span>
        </div>
      )}
    </div>
  );
  const halves = (
    // Fixed widths: the image renderer collapses flex-grown boxes in a column.
    <div style={{ display: "flex", flexDirection: story ? "row" : "column", gap: s(14, 24), width: s(400, 888) }}>
      {type.halves.map((half, i) => {
        const person = card.people[i]!;
        const fill = person.seat === "host" ? BRAND.navy : BRAND.pink;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", width: s(400, 432), padding: s(18, 32), borderRadius: s(22, 36), background: "rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: s(12, 20) }}>
              <div
                style={{
                  display: "flex",
                  width: s(36, 64),
                  height: s(36, 64),
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  background: fill,
                  color: person.seat === "host" ? BRAND.white : BRAND.ink,
                  fontSize: s(17, 30),
                  fontWeight: 900,
                  border: "2px solid rgba(255,255,255,0.25)",
                }}
              >
                {person.name?.charAt(0).toUpperCase() ?? ""}
              </div>
              {person.name && <div style={{ fontSize: s(18, 30), fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{`${person.name} is`}</div>}
            </div>
            <div style={{ marginTop: s(10, 20), fontSize: s(28, 48), fontWeight: 900, lineHeight: 1.05 }}>{half.name}</div>
            <div style={{ marginTop: s(4, 10), fontSize: s(17, 30), fontWeight: 700, lineHeight: 1.3, color: "rgba(255,255,255,0.6)" }}>{half.line}</div>
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
  const title = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: s(26, 44), fontWeight: 700, color: BRAND.pink, marginBottom: s(12, 24) }}>{cardLead(card)}</div>
      {name}
      <div style={{ marginTop: s(16, 36), fontSize: s(28, 50), fontWeight: 700, color: BRAND.pink }}>{type.nickname}</div>
      <div style={{ marginTop: s(4, 10), fontSize: s(22, 38), fontWeight: 700, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>{type.tagline}</div>
    </div>
  );

  return new ImageResponse(
    story ? (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BRAND.ink, color: BRAND.white, fontFamily: "Gabarito", padding: 96 }}>
        {brand}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ fontSize: 34, fontWeight: 900 }}>11:58pm</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 72 }}>That’s the day.</div>
          {title}
          <div style={{ display: "flex", marginTop: 72 }}>{halves}</div>
          <div style={{ display: "flex", marginTop: 64 }}>{mindReading}</div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{`Find out which two you are at ${site}`}</div>
      </div>
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "space-between", background: BRAND.ink, color: BRAND.white, fontFamily: "Gabarito", padding: "52px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
          {brand}
          <div style={{ display: "flex", marginTop: "auto" }}>{title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 400, justifyContent: "space-between" }}>
          {mindReading}
          {halves}
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
