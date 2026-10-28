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
      <main className="min-h-dvh bg-navy text-white">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-6 px-5 pb-12">
          <p className="text-xl font-black text-pink">PMTI</p>
          <h1 className="text-[clamp(3rem,15vw,4.25rem)] leading-[0.92] font-black tracking-[-0.035em]">
            You&apos;re invited to a Cornell day for two.
          </h1>
          <p className="text-xl text-white/85">Sign in with your Cornell account to join game {code}.</p>
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
      <main className="min-h-dvh bg-white">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
          <p role="alert" className="text-4xl leading-tight font-black tracking-[-0.02em]">
            {loaded.error}
          </p>
          <Link href="/" className="btn btn-primary self-start">
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
