import { currentUser } from "@/server/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StartGame } from "@/components/game/start-game";

const HOW = [
  { tone: "bg-pink text-ink", big: "Pick in secret.", small: "Thirteen quick rounds through one Cornell day, from a cancelled prelim to the walk home." },
  { tone: "bg-red text-white", big: "Reveal together.", small: "Both answers land at the same time. Mash the 🍅 if you have to." },
  { tone: "bg-white text-ink", big: "Find your duo type.", small: "Olin & Uris? Level B & Alley Cat Cafe? Each of you gets your own half." },
];

export default async function Home() {
  const user = await currentUser();

  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto flex min-h-[86dvh] max-w-md flex-col justify-end gap-6 px-5 pt-10 pb-12">
          <p className="text-xl font-black text-pink">PMTI</p>
          <h1 className="text-[clamp(3.25rem,17vw,5rem)] leading-[0.9] font-black tracking-[-0.035em]">A Cornell day for two.</h1>
          <p className="text-xl leading-snug text-white/85">
            A game you play together, each on your own phone. Find out what kind of duo you are.
          </p>
          {user ? (
            <>
              <StartGame />
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
        </div>
      </section>

      {HOW.map(({ tone, big, small }) => (
        <section key={big} className={tone}>
          <div className="mx-auto flex max-w-md flex-col gap-3 px-5 py-14">
            <h2 className="text-[clamp(2.5rem,12vw,3.25rem)] leading-[0.95] font-black tracking-[-0.03em]">{big}</h2>
            <p className="text-xl leading-snug opacity-85">{small}</p>
          </div>
        </section>
      ))}

      <footer className="bg-navy text-white/70">
        <p className="mx-auto max-w-md px-5 py-10">Made by Cornell Perfect Match. Questions: perfectmatch@cornell.edu</p>
      </footer>
    </main>
  );
}
