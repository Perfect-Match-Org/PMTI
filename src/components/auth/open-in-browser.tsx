"use client";

import { useState } from "react";

/**
 * Instagram, Snapchat and the like open links in their own browser, where Google refuses to sign
 * anyone in. Instead of a button that fails, this gets you out to a real browser first.
 */
export function OpenInBrowser({ app, android }: { app: string; android: boolean }) {
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);
  const [href, setHref] = useState("");

  async function copy() {
    setHref(window.location.href);
    const ok = await navigator.clipboard?.writeText(window.location.href).then(
      () => true,
      () => false
    );
    setCopied(ok ? "yes" : "failed");
  }

  function openChrome() {
    const { host, pathname, search } = window.location;
    window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] bg-white/10 p-4 lg:p-5">
      <p className="text-lg leading-snug font-bold">{app}’s browser can’t sign in with Google.</p>
      <p className="leading-snug text-white/75">
        Tap the ⋯ menu and open this page in {android ? "Chrome" : "Safari"}, or copy the link and paste it there.
      </p>
      {android && (
        <button type="button" onClick={openChrome} className="btn btn-pink w-full">
          Open in Chrome
        </button>
      )}
      <button type="button" onClick={copy} className={`btn w-full ${android ? "btn-secondary" : "btn-pink"}`}>
        {copied === "yes" ? "Copied" : "Copy link"}
      </button>
      {copied === "failed" && (
        <input readOnly value={href} onFocus={(event) => event.target.select()} aria-label="Link to this page" className="field text-sm" />
      )}
    </div>
  );
}
