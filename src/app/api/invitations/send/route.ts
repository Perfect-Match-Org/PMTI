import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/dbConnect";
import Invitation from "@/db/models/invitation";
import User from "@/db/models/user";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { netid, relationship } = await request.json();
    const toEmail = `${netid}@cornell.edu`;

    // Check if user exists
    const fromUser = await User.findOne({ email: session.user.email });
    if (!fromUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      fromUser: fromUser._id,
      toEmail,
      status: "pending",
    });

    // TODO: After implementing email notification, can resend email if invitation already exists
    if (existingInvitation) {
      return NextResponse.json({ error: "Invitation already sent" }, { status: 400 });
    }

    // Create new invitation
    const invitation = new Invitation({
      fromUser: fromUser._id,
      relationship,
      toEmail,
      status: "pending",
    });

    await invitation.save();

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation._id,
        toEmail,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
