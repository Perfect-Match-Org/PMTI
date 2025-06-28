import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { validateSurveyAccess } from "@/db/services/invitationService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const hasAccess = await validateSurveyAccess(resolvedParams.sessionId, session.user.email);
    
    return Response.json({ hasAccess });
  } catch (error) {
    console.error("Survey validation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}