import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserByEmail, getSentInvitations } from "@/db/services";

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

    // Get sent invitations (limit to 1 since user can only have one pending invitation at a time in the form)
    const sentInvitations = await getSentInvitations(session.user.email, 1);

    return NextResponse.json({
      outbound: sentInvitations[0] || null, // Return the first sent invitation or null if none exist
    });
  } catch (error) {
    console.error("Failed to fetch sent invitations:", error);
    return NextResponse.json({ error: "Failed to fetch sent invitations" }, { status: 500 });
  }
}
