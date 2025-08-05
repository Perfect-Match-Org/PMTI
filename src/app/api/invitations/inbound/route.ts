import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserByEmail, getReceivedInvitations } from "@/db/services";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get received invitations
    const receivedInvitations = await getReceivedInvitations(session.user.email, 10);

    return NextResponse.json({
      inbound: receivedInvitations,
    });
  } catch (error) {
    console.error("Failed to fetch received invitations:", error);
    return NextResponse.json({ error: "Failed to fetch received invitations" }, { status: 500 });
  }
}