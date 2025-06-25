import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cancelInvitation, getInvitationById } from "@/db/services";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the invitation
    const invitation = await getInvitationById(params.id);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Verify user is the sender (only sender can cancel)
    if (invitation.fromUserEmail !== session.user.email) {
      return NextResponse.json({ error: "Only the sender can cancel an invitation" }, { status: 403 });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Can only cancel pending invitations" }, { status: 400 });
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "Cannot cancel expired invitation" }, { status: 400 });
    }

    const updatedInvitation = await cancelInvitation(params.id);

    return NextResponse.json({
      success: true,
      status: updatedInvitation.status,
    });
  } catch (error) {
    console.error("Failed to cancel invitation:", error);
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 });
  }
}