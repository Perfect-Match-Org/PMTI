import { currentUser } from "@/server/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StartGame } from "@/components/game/start-game";
import { phaseOf, splitTime } from "@/game/day";

const DAY = [
  { time: "12:15pm", line: "It's snowing sideways. It's April. Five this-or-thats, ten seconds." },
  { time: "5:30pm", line: "Dinner. Where? You keep picking until you agree." },
  { time: "11:50pm", line: "Then the day ends, and you find out what kind of duo you are: Olin & Uris? Level B & Alley Cat Cafe?" },
];

export default async function Home() {
  const user = await currentUser();

  return (
    <main>
      <section data-phase="morning" className="stage">
        <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-end gap-6 px-4 pt-10 pb-12">
          <p className="font-display text-xl text-pm-red">PMTI</p>
          <h1 className="font-display text-[clamp(3rem,16vw,4.5rem)] leading-[0.92]">A Cornell day for two.</h1>
          <p className="text-xl leading-snug">
            Play it together, each on your own phone. Pick in secret, reveal at the same time, and find out what
            kind of duo you are.
          </p>
          {user ? (
            <>
              <StartGame />
              <p className="flex flex-wrap items-center gap-x-3 text-sm">
                Signed in as {user.email}
                <SignOutButton />
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="font-medium">Sign in with your Cornell account to start.</p>
              <GoogleButton />
              <DevLogin />
            </div>
          )}
        </div>
      </section>

      {DAY.map(({ time, line }) => {
        const { clock, meridiem } = splitTime(time);
        return (
          <section key={time} data-phase={phaseOf(time)} className="stage">
            <div className="mx-auto flex max-w-md flex-col gap-2 px-4 py-10">
              <p className="font-display text-6xl leading-none text-[var(--clock)]">
                {clock}
                <span className="ml-1 text-2xl">{meridiem}</span>
              </p>
              <p className="text-lg leading-snug">{line}</p>
            </div>
          </section>
        );
      })}

      <footer data-phase="night" className="stage border-t border-white/20">
        <p className="mx-auto max-w-md px-4 pb-10 text-sm">
          Made by Cornell Perfect Match. Questions: perfectmatch@cornell.edu
        </p>
      </footer>
    </main>
  );
}
