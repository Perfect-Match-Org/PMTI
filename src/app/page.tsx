import type { Viewport } from "next";
import { currentUser } from "@/server/auth";
import { SignIn } from "@/components/auth/sign-in";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { JoinWithCode } from "@/components/game/join-with-code";
import { StartGame } from "@/components/game/start-game";
import { DuoShowcase } from "@/components/ui/duo-showcase";
import { Hero, Pitch } from "@/components/ui/hero";
import { PmLogo } from "@/components/ui/pm-logo";

export const viewport: Viewport = { themeColor: "#24438d" };

export default async function Home() {
  const user = await currentUser();

  return (
    <main>
      <Hero>
        <Pitch>
          {!user && (
            <>
              {" "}
              Play with your partner, or with a friend as if you’d been dating since <span className="whitespace-nowrap">O-Week.</span>
            </>
          )}
        </Pitch>
        {user ? (
          <div className="flex flex-col gap-3">
            <StartGame />
            <div className="mt-3 lg:max-w-[18rem]">
              <JoinWithCode />
            </div>
            <p className="flex flex-wrap items-center gap-x-3 pt-2 text-sm text-white/60">
              Signed in as {user.email}
              <SignOutButton />
            </p>
          </div>
        ) : (
          <SignIn />
        )}
      </Hero>
      <DuoShowcase />
      <footer className="bg-navy text-white">
        <div className="frame flex flex-col gap-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <PmLogo gap="var(--color-navy)" className="h-10 w-auto text-white" />
            <p className="text-white/80">Made by Cornell Perfect Match</p>
          </div>
          <p className="flex flex-col gap-1.5 text-white/80 lg:flex-row lg:gap-8">
            <a href="https://perfectmatch.ai" className="font-semibold underline-offset-4 hover:underline">
              perfectmatch.ai
            </a>
            <a href="mailto:cornell.perfectmatch@gmail.com" className="font-semibold underline-offset-4 hover:underline">
              cornell.perfectmatch@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
