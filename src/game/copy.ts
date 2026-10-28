import type { Copy } from "./deck";
import type { Mode, Pair, Seat } from "./engine";

/** Resolves mode-specific copy and fills {p} (partner) / {s} (subject) style placeholders. */
export function say(copy: Copy, mode: Mode, vars: Record<string, string> = {}): string {
  const raw = typeof copy === "string" ? copy : copy[mode];
  return raw.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

/** Names a player from the viewer's side: your own phone says "you", never your name. */
export type Who = (seat: Seat, capital?: boolean) => string;

export function whoFor(viewer: Seat, names: Pair<string>): Who {
  return (seat, capital = false) => (seat === viewer ? (capital ? "You" : "you") : names[seat]);
}
