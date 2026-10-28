"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/client/supabase";

type GoogleId = {
  initialize(config: {
    client_id: string;
    nonce: string;
    callback: (response: { credential: string }) => void;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: { theme?: string; size?: string; shape?: string; text?: string; width?: number }
  ): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

// Google gets the SHA-256 of the nonce; Supabase gets the raw value and hashes it itself.
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

export function GoogleButton() {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  async function init() {
    const google = window.google;
    if (!clientId || !google || !container.current) return;
    const nonce = await makeNonce();
    google.accounts.id.initialize({
      client_id: clientId,
      nonce: nonce.hashed,
      use_fedcm_for_button: true,
      callback: async ({ credential }) => {
        const { error } = await supabaseBrowser().auth.signInWithIdToken({
          provider: "google",
          token: credential,
          nonce: nonce.raw,
        });
        if (error) setError(error.message);
        else router.refresh();
      },
    });
    google.accounts.id.renderButton(container.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
    });
  }

  if (!clientId) return null;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onReady={() => void init()} />
      <div ref={container} />
      {error && (
        <p role="alert" className="card border-pm-red font-medium">
          {error}
        </p>
      )}
    </>
  );
}
