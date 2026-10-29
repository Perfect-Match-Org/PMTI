"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/client/supabase";
import { ErrorNote } from "@/components/ui/error-note";

// Local-only shortcut so two test players can sign in without Google. Disabled on hosted projects.
const DEV_PASSWORD = "local-dev-only";

export function DevLogin() {
  const router = useRouter();
  const [who, setWho] = useState("Alice");
  const [error, setError] = useState<string | null>(null);

  if (process.env.NEXT_PUBLIC_DEV_LOGIN !== "1") return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    // A bare name becomes name@cornell.edu; a full address is used as is.
    const email = who.includes("@") ? who.trim() : `${who.trim().toLowerCase().replace(/[^a-z0-9.]/g, "")}@cornell.edu`;
    const auth = supabaseBrowser().auth;
    let { error } = await auth.signInWithPassword({ email, password: DEV_PASSWORD });
    if (error?.code === "invalid_credentials") {
      const name = email.split("@")[0] ?? email;
      ({ error } = await auth.signUp({
        email,
        password: DEV_PASSWORD,
        options: { data: { full_name: name.charAt(0).toUpperCase() + name.slice(1) } },
      }));
    }
    if (error) setError(error.message);
    else router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" aria-label="Dev sign-in">
      <label className="text-sm font-medium" htmlFor="dev-email">
        Dev sign-in (local only)
      </label>
      <div className="flex gap-3">
        <input
          id="dev-email"
          value={who}
          onChange={(event) => setWho(event.target.value)}
          placeholder="Any name, like Bob"
          autoComplete="off"
          className="field flex-1"
        />
        <button type="submit" className="btn btn-pink">
          Sign in
        </button>
      </div>
      {error && (
        <ErrorNote>{error}</ErrorNote>
      )}
    </form>
  );
}
