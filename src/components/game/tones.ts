import type { Tone } from "@/game/verdicts";

/** The verdict colors: a match floods red (the heart), a miss floods deep navy, and in between stays white. */
export const TONE_BG: Record<Tone, string> = { match: "bg-red", between: "bg-white", miss: "bg-navy-deep" };
/** The text on each, as a value motion can animate to. */
export const TONE_TEXT: Record<Tone, string> = { match: "#ffffff", between: "#1a2550", miss: "#ffffff" };
