import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSurveyById } from "@/db/services/surveyService";
import { ParticipantStatus } from "@/types/survey";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ surveyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { surveyId } = await context.params;

    const { survey, partnerId } = await getSurveyById(surveyId, session.user.email);

    // Transform database state (ParticipantSubmissionState) to client state (ParticipantStatus)
    // Database only contains hasSubmitted; ephemeral state managed client-side
    const participantStatus: Record<string, ParticipantStatus> = {};
    if (survey.participantStatus) {
      for (const [email, submissionState] of Object.entries(survey.participantStatus)) {
        participantStatus[email] = {
          hasSubmitted: submissionState.hasSubmitted,
          // Ephemeral fields (currentSelection, questionId, timestamp) not included
          // These will be populated by real-time broadcasts on the client
        };
      }
    }

    return NextResponse.json({
      currentQuestionIndex: survey.currentQuestionIndex,
      participantStatus,
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
