import Link from "next/link";
import { NavyHeadline, NavyPage } from "@/components/ui/navy-page";
import { JoinWithCode } from "./join-with-code";

/** A game you can't get into: what happened, then a way on, with another code or a game of your own. */
export function GameClosed({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <NavyPage>
      <NavyHeadline alert>{message}</NavyHeadline>
      {children}
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-white/70">Have a different code?</p>
        <JoinWithCode placeholder="Six letters and numbers" />
      </div>
      <Link href="/" className="btn btn-pink self-start">
        Start your own game
      </Link>
    </NavyPage>
  );
}
