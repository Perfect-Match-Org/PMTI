import type { Pair, PlayerInfo } from "@/game/engine";

/** The made-up couple the landing shows playing: the deck's rounds, then their result card. */
export const SAMPLE_NAMES: Pair<string> = { host: "Sam", guest: "Jordan" };
export const SAMPLE_PLAYERS: Pair<PlayerInfo> = {
  host: { name: SAMPLE_NAMES.host, avatarUrl: null },
  guest: { name: SAMPLE_NAMES.guest, avatarUrl: null },
};
