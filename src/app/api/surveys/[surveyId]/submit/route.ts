import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveSurveyResponse, getSurveyById } from "@/db/services/surveyService";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { surveyId } = await context.params;
    const { questionId, selectedOption } = await request.json();

    if (!questionId || !selectedOption) {
      return NextResponse.json({ error: "Missing questionId or selectedOption" }, { status: 400 });
    }

    // Verify user has access to this survey
    await getSurveyById(surveyId, session.user.email);

    // Save user's response and get updated participant status
    const participantStatus = await saveSurveyResponse(
      surveyId,
      session.user.email,
      questionId,
      selectedOption
    );

    return NextResponse.json({
      success: true,
      participantStatus,
    });
  } catch (error) {
    console.error("Error submitting response:", error);
    const message = error instanceof Error ? error.message : "Failed to submit response";

    const status = message.includes("Survey not found")
      ? 404
      : message.includes("Access denied")
      ? 403
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
