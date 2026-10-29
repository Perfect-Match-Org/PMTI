"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The reduced-motion preference for choices made in render (skip a step, hold a still frame).
 * False on the server and during hydration, so both draw the same first frame; motion's own hook
 * reads the browser at once and breaks hydration.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => matchMedia(QUERY).matches,
    () => false
  );
}
