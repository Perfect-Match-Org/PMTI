import type { Copy } from "./deck";
import type { Mode } from "./engine";

/** Resolves mode-specific copy and fills {p} (partner) / {s} (subject) style placeholders. */
export function say(copy: Copy, mode: Mode, vars: Record<string, string> = {}): string {
  const raw = typeof copy === "string" ? copy : copy[mode];
  return raw.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}
