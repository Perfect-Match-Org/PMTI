import type { Viewport } from "next";
import { currentUser } from "@/server/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { JoinWithCode } from "@/components/game/join-with-code";
import { StartGame } from "@/components/game/start-game";
import { Hero } from "@/components/ui/hero";
import { TypeWall } from "@/components/ui/type-wall";

export const viewport: Viewport = { themeColor: "#24438d" };

export default async function Home() {
  const user = await currentUser();

  return (
    <main>
      <Hero title="A Cornell day for two.">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-xl leading-snug text-white/85">
            Thirteen quick rounds, each on your own phone. Pick in secret, reveal together, and find out what kind of duo
            you are.
          </p>
          <p className="text-lg leading-snug text-white/65">
            Play with your partner, or with a friend as if you’d been dating since O-Week.
          </p>
        </div>
        {user ? (
          <div className="flex max-w-xl flex-col gap-3">
            <StartGame />
            <JoinWithCode />
            <p className="flex flex-wrap items-center gap-x-3 pt-2 text-white/70">
              Signed in as {user.email}
              <SignOutButton />
            </p>
          </div>
        ) : (
          <div className="flex max-w-xl flex-col gap-5">
            <p className="font-semibold">Sign in with your Cornell account to start.</p>
            <GoogleButton />
            <DevLogin />
          </div>
        )}
      </Hero>
      <TypeWall />
      <footer className="bg-navy text-white/70">
        <p className="frame py-10 text-sm">
          Made by Cornell Perfect Match. Questions go to{" "}
          <a href="mailto:perfectmatch@cornell.edu" className="font-semibold text-white underline underline-offset-4">
            perfectmatch@cornell.edu
          </a>
        </p>
      </footer>
    </main>
  );
}
