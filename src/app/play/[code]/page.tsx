import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { currentUser } from "@/server/auth";
import { invitation, loadView, RoomError } from "@/server/rooms";
import { SignIn } from "@/components/auth/sign-in";
import { Game } from "@/components/game/game";
import { GameClosed } from "@/components/game/game-closed";
import { JoinGate } from "@/components/game/join-gate";
import { Avatar } from "@/components/ui/avatar";
import { Hero, Pitch } from "@/components/ui/hero";

type Props = { params: Promise<{ code: string }> };

// Signed out, this is the navy invitation; signed in, the white game.
export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await currentUser()) ? "#ffffff" : "#24438d" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invite = await invitation((await params).code.toUpperCase());
  if ("closed" in invite) return {};
  const title = `${invite.host.name} invited you to a Cornell day for two`;
  return { title, openGraph: { title }, twitter: { card: "summary_large_image", title } };
}

export default async function PlayPage({ params }: Props) {
  const code = (await params).code.toUpperCase();
  const user = await currentUser();

  if (!user) {
    const invite = await invitation(code);
    if ("closed" in invite) {
      return (
        <GameClosed message={invite.closed}>
          {invite.full && <SignIn note="Already one of the two? Sign in to get back in." />}
        </GameClosed>
      );
    }
    const { host, mode } = invite;
    return (
      <main className="min-h-dvh bg-navy">
        <Hero
          eyebrow={
            <>
              <Avatar player={host} tone="partner" size={36} />
              {host.name} invited you{mode === "friends" && ", as friends"}
            </>
          }
        >
          <Pitch>{mode === "friends" && " You’ll play as a couple in a parallel universe."}</Pitch>
          <SignIn note={`You’re joining ${host.name}’s game.`} />
        </Hero>
      </main>
    );
  }

  const loaded = await loadView(code, user.id).then(
    (view) => ({ view }),
    (error: unknown) => {
      if (error instanceof RoomError) return { error };
      throw error;
    }
  );
  if ("error" in loaded) {
    return loaded.error.status === 403 ? <JoinGate key={code} code={code} /> : <GameClosed message={loaded.error.message} />;
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return <Game initial={loaded.view} origin={origin} />;
}
