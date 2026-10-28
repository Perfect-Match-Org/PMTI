"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};

/**
 * Renders into <body>. Fixed-position layers (the action bar, the reveal flash, the result story)
 * must escape the animated screen wrapper: a transformed ancestor would otherwise become their
 * containing block and pin them mid-page instead of to the viewport.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const onClient = useSyncExternalStore(noop, () => true, () => false);
  return onClient ? createPortal(children, document.body) : null;
}
