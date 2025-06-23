import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/dbConnect";
import Invitation from "@/db/models/invitation";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { action } = await request.json(); // 'accept' or 'decline'

    const invitation = await Invitation.findById(params.id);
    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Verify user is the intended recipient
    if (invitation.toEmail !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (invitation.isExpired()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }

    if (action === "accept") {
      await invitation.accept();
    } else {
      await invitation.decline();
    }

    return NextResponse.json({
      success: true,
      status: invitation.status,
      sessionId: invitation.sessionId,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to respond to invitation" }, { status: 500 });
  }
}
