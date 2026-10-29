"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/client/supabase";
import { ErrorNote } from "@/components/ui/error-note";

const RETURNED_ERRORS: Record<string, string> = {
  failed: "Sign-in didn’t finish. Try again.",
};

/**
 * Sends you to Google's sign-in page and back to the page you were on (through /auth/callback).
 * A sign-in that failed on the way comes back as `?signin_error=<code>`.
 */
export function GoogleButton() {
  const code = useSearchParams().get("signin_error") ?? "";
  const returned = Object.hasOwn(RETURNED_ERRORS, code) ? RETURNED_ERRORS[code]! : null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    const next = encodeURIComponent(window.location.pathname);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  const shown = error ?? (busy ? null : returned);
  return (
    <>
      <button type="button" onClick={signIn} disabled={busy} className="btn btn-secondary w-full gap-3">
        <GoogleMark />
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
      {shown && (
        <ErrorNote>{shown}</ErrorNote>
      )}
    </>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden className="flex-none">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
