import { DevLogin } from "./dev-login";
import { GoogleButton } from "./google-button";

/** The signed-out action on the navy pages: Google, and who it's for. */
export function SignIn({ note }: { note?: string }) {
  return (
    <div className="flex flex-col gap-3 lg:max-w-[22.5rem]">
      <GoogleButton />
      <p className="text-sm text-white/55">Cornell accounts only.{note && ` ${note}`}</p>
      <DevLogin />
    </div>
  );
}
