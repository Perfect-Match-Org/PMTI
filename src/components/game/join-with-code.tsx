"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CODE = /^[A-Z0-9]{6}$/;

/**
 * For when scanning isn't handy: type the six-character code from your partner's screen, or paste
 * their link. It joins on the sixth character, so there's no button to find.
 */
export function JoinWithCode({ tone = "navy", placeholder = "Got a code? Type it here" }: { tone?: "navy" | "white"; placeholder?: string }) {
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
        Game code, 6 characters
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
        placeholder={placeholder}
        autoCapitalize="characters"
        autoComplete="off"
        enterKeyHint="go"
        className={`field py-3 font-bold tracking-[0.08em] placeholder:font-medium placeholder:tracking-normal ${
          tone === "navy" ? "border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-white" : "placeholder:text-muted"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold ${tone === "navy" ? "text-white/60" : "text-muted"}`}
      >
        {joining ? "Joining…" : code.length > 0 && code.length < 6 ? `${6 - code.length} more` : ""}
      </span>
    </form>
  );
}
