"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** For when scanning isn't handy: type the six-character code from your partner's screen. */
export function JoinWithCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const ready = /^[A-Z0-9]{6}$/.test(code);

  return (
    <form
      className="flex gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) router.push(`/play/${code}`);
      }}
    >
      <label htmlFor="join-code" className="sr-only">
        Game code
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
        placeholder="Have a code?"
        autoCapitalize="characters"
        autoComplete="off"
        className="field min-w-0 flex-1 bg-white/10 font-bold tracking-[0.08em] text-white placeholder:font-medium placeholder:tracking-normal placeholder:text-white/60"
      />
      <button type="submit" disabled={!ready} className="btn btn-pink flex-none">
        Join
      </button>
    </form>
  );
}
