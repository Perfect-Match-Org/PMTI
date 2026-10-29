"use client";

import { motion } from "motion/react";

/**
 * A duo type's name with its "&" in the italic serif: the one flourish in the type system, so a pair
 * always looks like a pair ("vs." stays in the sans, where the serif's v reads as an r). `stack` puts
 * each place on its own line; `spring` rises the words in one by one, as the result reveals them.
 */
const WORD_STAGGER = 0.12;

/** When a springing name started at `delay` has finished arriving, for whatever comes in after it. */
export const afterPairName = (name: string, delay: number) => delay + name.split(" ").length * WORD_STAGGER;

export function PairName({ name, stack = false, spring }: { name: string; stack?: boolean; spring?: { delay: number } }) {
  const [first = name, joiner, second] = name.split(/ (&|vs\.) /);
  let n = 0;
  const words = (text: string, joining = false) =>
    text.split(" ").map((word) => {
      const className = !joining
        ? undefined
        : word === "&"
          ? "font-pair text-[1.08em] leading-none font-medium tracking-normal italic"
          : "text-[0.8em] font-bold tracking-normal";
      if (!spring) return <span key={n++} className={className}>{word} </span>;
      const i = n++;
      return (
        <motion.span
          key={i}
          className={`mr-[0.25em] inline-block ${className ?? ""}`}
          initial={{ y: 40, opacity: 0, rotate: 4 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: spring.delay + i * WORD_STAGGER, type: "spring", stiffness: 380, damping: 18 }}
        >
          {word}
        </motion.span>
      );
    });

  if (!joiner || !second) return <>{words(name)}</>;
  const rest = (
    <>
      {words(joiner, true)}
      {words(second)}
    </>
  );
  return (
    <>
      {words(first)}
      {stack ? <span className="block">{rest}</span> : rest}
    </>
  );
}
