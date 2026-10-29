import type { Viewport } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { currentUser } from "@/server/auth";
import { isInRoom, loadView, RoomError } from "@/server/rooms";
import { SignIn } from "@/components/auth/sign-in";
import { Game } from "@/components/game/game";
import { JoinGate } from "@/components/game/join-gate";
import { Hero, Pitch } from "@/components/ui/hero";

// Signed out, this is the navy invitation; signed in, the white game.
export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await currentUser()) ? "#ffffff" : "#24438d" };
}

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  const user = await currentUser();

  if (!user) {
    return (
      <main className="min-h-dvh bg-navy">
        <Hero compact title="You’re invited to a Cornell day for two.">
          <Pitch />
          <SignIn note={`You’re joining game ${code}.`} />
        </Hero>
      </main>
    );
  }

  if (!(await isInRoom(code, user.id))) return <JoinGate key={code} code={code} />;

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
