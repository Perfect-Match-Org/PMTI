import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/dbConnect";
import Invitation from "@/db/models/invitation";
import User from "@/db/models/user";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get received invitations
    const receivedInvitations = await Invitation.find({
      toEmail: session.user.email,
      status: "pending",
    })
      .populate("fromUser", "name email")
      .sort({ sentAt: -1 })
      .limit(10); // Limit to 10 most recent invitations
    // Assuming that no one will receive more than 10 invitations at a time
    // Thus no pagination is needed

    return NextResponse.json({
      received: receivedInvitations,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}
