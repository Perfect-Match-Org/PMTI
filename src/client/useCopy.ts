"use client";

import { useState } from "react";

/**
 * Copies text to the clipboard and remembers how it went. "failed" covers browsers that refuse
 * (plain http, a denied permission, some in-app browsers), so the caller can show the text instead.
 */
export function useCopy() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy(text: string) {
    const ok = (await navigator.clipboard?.writeText(text).then(
      () => true,
      () => false
    )) ?? false;
    setState(ok ? "copied" : "failed");
  }
  return { state, copy };
}
