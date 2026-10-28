import { currentUser } from "@/server/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { DevLogin } from "@/components/auth/dev-login";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StartGame } from "@/components/game/start-game";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold">PMTI</h1>
      {user ? (
        <>
          <StartGame />
          <div className="flex items-center justify-between gap-4 text-sm">
            <p>
              Signed in as <strong>{user.email}</strong>
            </p>
            <SignOutButton />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <GoogleButton />
          <DevLogin />
        </div>
      )}
    </main>
  );
}
