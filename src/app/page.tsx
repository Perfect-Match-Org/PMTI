import { currentUser } from "@/server/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { JoinWithCode } from "@/components/game/join-with-code";
import { StartGame } from "@/components/game/start-game";
import { Hero } from "@/components/ui/hero";

export default async function Home() {
  const user = await currentUser();

  return (
    <Hero title="A Cornell day for two.">
      <p className="text-xl leading-snug text-white/85">
        Thirteen quick rounds, each on your own phone. Pick in secret, reveal together, and find out what kind of duo you
        are.
      </p>
      {user ? (
        <>
          <StartGame />
          <JoinWithCode />
          <p className="flex flex-wrap items-center gap-x-3 text-white/70">
            Signed in as {user.email}
            <SignOutButton />
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="font-semibold">Sign in with your Cornell account to start.</p>
          <GoogleButton />
          <DevLogin />
        </div>
      )}
      <p className="pt-6 text-sm text-white/60">Made by Cornell Perfect Match. Questions go to perfectmatch@cornell.edu</p>
    </Hero>
  );
}
