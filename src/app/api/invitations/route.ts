import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserByEmail, createInvitation, getPendingInvitation } from "@/db/services";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { netid, relationship } = await request.json();
    const toEmail = netid === "PM" ? "cornell.perfectmatch@gmail.com" : `${netid}@cornell.edu`; // PM for debugging purposes

    // Check if user exists
    const fromUser = await getUserByEmail(session.user.email);
    if (!fromUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if recipient user exists
    const toUser = await getUserByEmail(toEmail);
    if (!toUser) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 404 });
    }

    // Check for existing pending invitation
    const existingInvitation = await getPendingInvitation(fromUser.email, toEmail);

    // TODO: After implementing email notification, can resend email if invitation already exists
    if (existingInvitation) {
      return NextResponse.json({ error: "Invitation already sent" }, { status: 400 });
    }

    // Create new invitation
    const invitation = await createInvitation({
      fromUserEmail: fromUser.email,
      toEmail,
      relationship,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        toEmail,
        name: toUser.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}