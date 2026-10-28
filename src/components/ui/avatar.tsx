import type { PlayerInfo } from "@/game/engine";

/** The player's Google photo, or their initial on a color that tells the two of you apart. */
export function Avatar({ player, tone, size = 32 }: { player: PlayerInfo; tone: "me" | "partner"; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (player.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar, already sized.
    return <img src={player.avatarUrl} alt="" style={style} className="flex-none rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  return (
    <span
      aria-hidden
      style={style}
      className={`grid flex-none place-items-center rounded-full font-extrabold ${tone === "me" ? "bg-navy text-white" : "bg-pink text-ink"}`}
    >
      {player.name.charAt(0).toUpperCase()}
    </span>
  );
}
