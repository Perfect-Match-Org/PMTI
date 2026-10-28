import Link from "next/link";
import { headers } from "next/headers";
import { currentUser } from "@/server/auth";
import { isInRoom, loadView, RoomError } from "@/server/rooms";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { Game } from "@/components/game/game";
import { JoinGate } from "@/components/game/join-gate";

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  const user = await currentUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold">You&apos;re invited to a PMTI game</h1>
        <p>Sign in with your Cornell account to join.</p>
        <GoogleButton />
        <DevLogin />
      </main>
    );
  }

  if (!(await isInRoom(code, user.id))) return <JoinGate code={code} />;

  const loaded = await loadView(code, user.id).then(
    (view) => ({ view }),
    (error: unknown) => {
      if (error instanceof RoomError) return { error: error.message };
      throw error;
    }
  );
  if ("error" in loaded) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
        <p role="alert">{loaded.error}</p>
        <Link href="/" className="underline">
          Start a new game
        </Link>
      </main>
    );
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return <Game initial={loaded.view} origin={origin} />;
}
