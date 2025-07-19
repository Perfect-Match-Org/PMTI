import { eq, and, count } from "drizzle-orm";
import { dbConnect } from "@/lib/dbConnect";
import { surveys, surveyResponses, surveyHistory, type Survey } from "@/db/schema";
import { CoupleTypeCode, type ScoreWeights } from "@/lib/constants/coupleTypes";
import { SurveyStatus } from "@/db/schema/survey";

/**
 * Get survey count by status
 */
export async function getSurveyCountByStatus(status?: SurveyStatus): Promise<number> {
  const db = await dbConnect();

  try {
    const [result] = status
      ? await db.select({ count: count() }).from(surveys).where(eq(surveys.status, status)).limit(1)
      : await db.select({ count: count() }).from(surveys).limit(1);

    if (!result) {
      return 0;
    }

    return result.count;
  } catch (error) {
    console.error("Error getting survey count:", error);
    return 0; // Return 0 on timeout rather than throwing
  }
}

/**
 * Add individual responses to a survey (normalized approach)
 */
export async function addResponse(
  surveyId: string,
  userEmail: string,
  questionId: string,
  selectedOption: string
): Promise<void> {
  const db = await dbConnect();

  await db.transaction(async (tx) => {
    await tx.insert(surveyResponses).values({
      surveyId,
      userEmail,
      questionId,
      selectedOption,
      respondedAt: new Date(),
    });

    // Update survey's last activity
    await tx.update(surveys).set({ lastActivityAt: new Date() }).where(eq(surveys.id, surveyId));
  });
}

/**
 * Complete a survey with final results
 */
export async function completeSurvey(
  surveyId: string,
  result: {
    coupleType: CoupleTypeCode;
    participantScores: Record<string, ScoreWeights>;
    compatibility: {
      overallScore: number;
      dimensions: ScoreWeights;
    };
  }
): Promise<Survey> {
  const db = await dbConnect();

  // Get survey start time to calculate duration
  const [survey] = await db
    .select({ startedAt: surveys.startedAt })
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  if (!survey) {
    throw new Error("Survey not found");
  }

  const completedAt = new Date();
  const duration = Math.floor((completedAt.getTime() - survey.startedAt.getTime()) / 1000);

  const [updatedSurvey] = await db
    .update(surveys)
    .set({
      coupleType: result.coupleType,
      participantScores: result.participantScores,
      compatibility: result.compatibility,
      completedAt,
      duration,
      status: "completed",
    })
    .where(eq(surveys.id, surveyId))
    .returning();

  return updatedSurvey;
}

/**
 * Update current progress for reconnection handling
 * Note: With normalized schema, we don't store user1/user2 current choices in survey table
 * Instead, we can query the latest responses for each user
 */
export async function updateCurrentProgress(
  surveyId: string,
  questionIndex: number
): Promise<Survey> {
  const db = await dbConnect();

  const [updatedSurvey] = await db
    .update(surveys)
    .set({
      currentQuestionIndex: questionIndex,
      lastActivityAt: new Date(),
    })
    .where(eq(surveys.id, surveyId))
    .returning();

  return updatedSurvey;
}

/**
 * Get all responses for a survey grouped by user
 */
export async function getSurveyResponses(
  surveyId: string,
  limit: number = 1000,
  userEmail?: string
) {
  const db = await dbConnect();

  const whereConditions = userEmail
    ? and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.userEmail, userEmail))
    : eq(surveyResponses.surveyId, surveyId);

  return await db
    .select()
    .from(surveyResponses)
    .where(whereConditions)
    .orderBy(surveyResponses.respondedAt)
    .limit(limit);
}

/**
 * Get the latest response for each user for a specific question
 */
export async function getLatestUserResponses(
  surveyId: string,
  questionId: string,
  limit: number = 100
) {
  const db = await dbConnect();

  return await db
    .select()
    .from(surveyResponses)
    .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.questionId, questionId)))
    .orderBy(surveyResponses.respondedAt)
    .limit(limit);
}

/**
 * Get survey by session ID with participant information
 */
export async function getSurveyBySessionId(sessionId: string, currentUserEmail: string) {
  const db = await dbConnect();

  // Get existing survey
  const survey = await db.select().from(surveys).where(eq(surveys.sessionId, sessionId)).limit(1);

  if (!survey.length) {
    throw new Error("Survey not found");
  }

  // Get partner from history
  const history = await db
    .select({
      user1Email: surveyHistory.user1Email,
      user2Email: surveyHistory.user2Email,
    })
    .from(surveyHistory)
    .where(eq(surveyHistory.surveyId, survey[0].id))
    .limit(1);

  if (!history.length) {
    throw new Error("Survey data corrupted");
  }

  // Verify user has access
  if (history[0].user1Email !== currentUserEmail && history[0].user2Email !== currentUserEmail) {
    throw new Error("Access denied");
  }

  // Determine partner
  const partnerId =
    history[0].user1Email === currentUserEmail ? history[0].user2Email : history[0].user1Email;

  return {
    survey: survey[0],
    partnerId,
  };
}

/**
 * Advance survey to next question
 */
export async function advanceSurvey(sessionId: string, totalQuestions: number) {
  const db = await dbConnect();

  // Get current survey state
  const existingSurvey = await db
    .select()
    .from(surveys)
    .where(eq(surveys.sessionId, sessionId))
    .limit(1);

  if (!existingSurvey.length) {
    throw new Error("Survey not found");
  }

  const survey = existingSurvey[0];
  const nextQuestionIndex = survey.currentQuestionIndex + 1;

  if (nextQuestionIndex >= totalQuestions) {
    // Survey completed
    await db
      .update(surveys)
      .set({
        status: "completed",
        completedAt: new Date(),
        currentQuestionIndex: nextQuestionIndex,
        participantStatus: {}, // Clear status
      })
      .where(eq(surveys.sessionId, sessionId));

    return {
      success: true,
      completed: true,
      currentQuestionIndex: nextQuestionIndex,
    };
  }

  // Advance to next question
  await db
    .update(surveys)
    .set({
      currentQuestionIndex: nextQuestionIndex,
      participantStatus: {}, // Reset participant status for new question
      lastActivityAt: new Date(),
    })
    .where(eq(surveys.sessionId, sessionId));

  return {
    success: true,
    completed: false,
    currentQuestionIndex: nextQuestionIndex,
  };
}

/**
 * Save survey response and update participant status
 */
export async function saveSurveyResponse(
  sessionId: string,
  userEmail: string,
  questionId: string,
  selectedOption: string
) {
  const db = await dbConnect();
  const now = new Date();

  // Get survey
  const existingSurvey = await db
    .select()
    .from(surveys)
    .where(eq(surveys.sessionId, sessionId))
    .limit(1);

  if (!existingSurvey.length) {
    throw new Error("Survey not found");
  }

  const survey = existingSurvey[0];

  // Save response and update participant status in transaction
  await db.transaction(async (tx) => {
    // Save response
    await tx.insert(surveyResponses).values({
      surveyId: survey.id,
      userEmail,
      questionId,
      selectedOption,
      respondedAt: now,
    });

    // Update participant status to show submission
    const currentParticipantStatus = survey.participantStatus || {};
    const updatedStatus = {
      ...currentParticipantStatus,
      [userEmail]: {
        ...currentParticipantStatus[userEmail],
        isOnline: true,
        currentSelection: selectedOption,
        hasSubmitted: true,
        lastSeen: now,
      },
    };

    await tx
      .update(surveys)
      .set({
        participantStatus: updatedStatus,
        lastActivityAt: now,
      })
      .where(eq(surveys.sessionId, sessionId));
  });

  // Return updated status
  const updatedSurvey = await db
    .select({ participantStatus: surveys.participantStatus })
    .from(surveys)
    .where(eq(surveys.sessionId, sessionId))
    .limit(1);

  return updatedSurvey[0].participantStatus;
}
