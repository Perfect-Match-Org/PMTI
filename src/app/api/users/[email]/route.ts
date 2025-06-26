import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserByEmail } from "@/db/services";

export async function GET(request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email: rawEmail } = await params;
    const email = decodeURIComponent(rawEmail);

    // Validate email format
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return only safe user data
    return NextResponse.json({
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      hasRegistered: user.hasRegistered,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
