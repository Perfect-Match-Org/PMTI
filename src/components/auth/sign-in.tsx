import { headers } from "next/headers";
import { DevLogin } from "./dev-login";
import { GoogleButton } from "./google-button";
import { OpenInBrowser } from "./open-in-browser";

// Apps whose built-in browser Google blocks from signing in ("disallowed_useragent"). Messenger before Facebook.
const IN_APP: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/Snapchat/i, "Snapchat"],
  [/musical_ly|TikTok|BytedanceWebview/i, "TikTok"],
  [/MessengerForiOS|FB_IAB\/Orca/i, "Messenger"],
  [/FBAN|FBAV|FB_IAB/i, "Facebook"],
  [/LinkedInApp/i, "LinkedIn"],
  [/MicroMessenger/i, "WeChat"],
  [/\bLine\//, "LINE"],
];

/** The signed-out action on the navy pages: Google, or a way out of an app's browser first. */
export async function SignIn({ note }: { note?: string }) {
  const agent = (await headers()).get("user-agent") ?? "";
  const app = IN_APP.find(([pattern]) => pattern.test(agent))?.[1];
  return (
    <div className="flex flex-col gap-3 lg:max-w-[22.5rem]">
      {app ? <OpenInBrowser app={app} android={/Android/i.test(agent)} /> : <GoogleButton />}
      {note && <p className="text-sm text-white/55">{note}</p>}
      <DevLogin />
    </div>
  );
}
