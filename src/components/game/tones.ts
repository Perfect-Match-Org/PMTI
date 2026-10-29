import { BRAND } from "@/brand";
import type { Tone } from "@/game/verdicts";

/** The verdict colors: a match floods Cornell red, a miss floods deep navy, and in between stays white. */
export const TONE_BG: Record<Tone, string> = { match: "bg-carnelian", between: "bg-white", miss: "bg-navy-deep" };
/** The text on each, as a value motion can animate to. */
export const TONE_TEXT: Record<Tone, string> = { match: BRAND.white, between: BRAND.ink, miss: BRAND.white };
/** The fill as a value, for generated images. */
export const TONE_FILL: Record<Tone, string> = { match: BRAND.carnelian, between: BRAND.white, miss: BRAND.navyDeep };
