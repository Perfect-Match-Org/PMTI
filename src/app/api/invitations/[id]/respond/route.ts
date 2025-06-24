import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { acceptInvitation, declineInvitation, checkAndExpireInvitation, getInvitationById } from "@/db/services";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' or 'decline'

    // Get the invitation
    const invitation = await getInvitationById(params.id);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Verify user is the intended recipient
    if (invitation.toUserEmail !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check and expire if needed
    const checkedInvitation = await checkAndExpireInvitation(params.id);
    if (checkedInvitation.status === "expired") {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }

    let updatedInvitation;
    if (action === "accept") {
      updatedInvitation = await acceptInvitation(params.id);
    } else {
      updatedInvitation = await declineInvitation(params.id);
    }

    return NextResponse.json({
      success: true,
      status: updatedInvitation.status,
      sessionId: updatedInvitation.sessionId,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to respond to invitation" }, { status: 500 });
  }
}
