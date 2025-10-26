import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvitationForm } from "@/components/lobby/invitationForm";
import { PendingInvitations } from "@/components/lobby/pendingInvitations";
import { LiveStats } from "@/components/lobby/liveStats";

export default async function LobbyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-12 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Quiz Lobby</h1>
          <p className="text-xl text-muted-foreground">
            Invite your partner to discover your couple type together
          </p>
        </div>
        <LiveStats />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <InvitationForm />
          </div>
          <div className="space-y-6">
            <PendingInvitations />
          </div>
        </div>
      </div>
    </main>
  );
}
