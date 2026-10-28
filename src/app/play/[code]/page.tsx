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
      <main data-phase="morning" className="stage">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
          <p className="font-display text-xl text-pm-red">PMTI</p>
          <h1 className="font-display text-[clamp(2.75rem,14vw,4rem)] leading-[0.95]">
            You&apos;re invited to a Cornell day for two.
          </h1>
          <p className="text-lg">Sign in with your Cornell account to join game {code}.</p>
          <GoogleButton />
          <DevLogin />
        </div>
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
      <main data-phase="morning" className="stage">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
          <p role="alert" className="font-display text-3xl leading-tight">
            {loaded.error}
          </p>
          <Link href="/" className="btn self-start">
            Start a new game
          </Link>
        </div>
      </main>
    );
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return <Game initial={loaded.view} origin={origin} />;
}
