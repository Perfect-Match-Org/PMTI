import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSurveyBySessionId } from "@/db/services/surveyService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await context.params;

    const { survey, partnerId } = await getSurveyBySessionId(sessionId, session.user.email);

    return NextResponse.json({
      currentQuestionIndex: survey.currentQuestionIndex,
      participantStatus: survey.participantStatus || {},
      status: survey.status,
      partnerId,
    });
  } catch (error) {
    console.error("Error fetching survey status:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch status";
    const status = message.includes("Invalid session")
      ? 404
      : message.includes("Access denied")
      ? 403
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
