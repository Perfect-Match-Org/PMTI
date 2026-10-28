"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/client/supabase";

// Local-only shortcut so two test players can sign in without Google. Disabled on hosted projects.
const DEV_PASSWORD = "local-dev-only";

export function DevLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("alice@cornell.edu");
  const [error, setError] = useState<string | null>(null);

  if (process.env.NEXT_PUBLIC_DEV_LOGIN !== "1") return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
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
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field flex-1"
        />
        <button type="submit" className="btn">
          Sign in
        </button>
      </div>
      {error && (
        <p role="alert" className="card border-pm-red font-medium">
          {error}
        </p>
      )}
    </form>
  );
}
