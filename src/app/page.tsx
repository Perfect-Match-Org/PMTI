import { currentUser } from "@/server/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { JoinWithCode } from "@/components/game/join-with-code";
import { StartGame } from "@/components/game/start-game";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="min-h-dvh bg-navy text-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-6 px-5 pt-10 pb-12">
        <p className="text-xl font-black text-pink">PMTI</p>
        <h1 className="text-[clamp(3.25rem,17vw,5rem)] leading-[0.9] font-black tracking-[-0.035em]">A Cornell day for two.</h1>
        <p className="text-xl leading-snug text-white/85">
          Thirteen quick rounds, each on your own phone. Pick in secret, reveal together, and find out what kind of duo
          you are.
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
      </div>
    </main>
  );
}
