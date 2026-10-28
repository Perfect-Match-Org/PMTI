import type { Tone } from "@/game/verdicts";

/** The three verdict colors: pink for a match, navy for in between, red for a miss. */
export const TONES: Record<Tone, string> = { pink: "bg-pink text-ink", navy: "bg-navy text-white", red: "bg-red text-white" };
