import type { Pair, PlayerInfo } from "@/game/engine";

/**
 * The couple the landing shows playing, the deck's rounds and then their result card: Touchdown, the
 * Big Red Bear, and Ezra Cornell, dating in a parallel universe.
 */
export const SAMPLE_NAMES: Pair<string> = { host: "Touchdown", guest: "Ezra" };
export const SAMPLE_PLAYERS: Pair<PlayerInfo> = {
  host: { name: SAMPLE_NAMES.host, avatarUrl: null },
  guest: { name: SAMPLE_NAMES.guest, avatarUrl: null },
};
