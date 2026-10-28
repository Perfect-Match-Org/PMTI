"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/client/supabase";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded border px-3 py-2"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
