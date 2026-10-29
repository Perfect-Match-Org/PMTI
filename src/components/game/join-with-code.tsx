"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CODE = /^[A-Z0-9]{6}$/;

/**
 * For when scanning isn't handy: type the six-character code from your partner's screen, or paste
 * their link. It joins on the sixth character, so there's no button to find.
 */
export function JoinWithCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joining, startJoining] = useTransition();
  const join = (value: string) => startJoining(() => router.push(`/play/${value}`));

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        if (CODE.test(code)) join(code);
      }}
    >
      <label htmlFor="join-code" className="sr-only">
        Game code
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(event) => {
          const typed = event.target.value;
          const next = (typed.match(/play\/([a-z0-9]{6})/i)?.[1] ?? typed)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 6);
          setCode(next);
          if (CODE.test(next) && next !== code) join(next);
        }}
        readOnly={joining}
        placeholder="Got a code? Type it here"
        autoCapitalize="characters"
        autoComplete="off"
        enterKeyHint="go"
        className="field border-white/20 bg-white/10 font-bold tracking-[0.08em] text-white placeholder:font-medium placeholder:tracking-normal placeholder:text-white/60 focus:border-white"
      />
      {joining && (
        <span aria-live="polite" className="absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-white/70">
          Joining…
        </span>
      )}
    </form>
  );
}
