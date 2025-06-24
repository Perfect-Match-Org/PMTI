import { eq, and, count } from "drizzle-orm";
import { dbConnect } from "@/lib/dbConnect";
import { surveys, surveyResponses, type Survey } from "@/db/schema";
import { CoupleTypeCode, type ScoreWeights } from "@/lib/constants/coupleTypes";
import { SurveyStatus } from "@/db/schema/survey";

/**
 * Get survey count by status
 */
export async function getSurveyCountByStatus(status?: SurveyStatus): Promise<number> {
  const db = await dbConnect();

  let query = db.select({ count: count() }).from(surveys);

  if (status) {
    query.where(eq(surveys.status, status));
  }

  const [result] = await query;

  if (!result) {
    return 0;
  }

  return result.count;
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

  await db.insert(surveyResponses).values({
    surveyId,
    userEmail,
    questionId,
    selectedOption,
    respondedAt: new Date(),
  });

  // Update survey's last activity
  await db.update(surveys).set({ lastActivityAt: new Date() }).where(eq(surveys.id, surveyId));
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
export async function getSurveyResponses(surveyId: string) {
  const db = await dbConnect();

  return await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(surveyResponses.respondedAt);
}

/**
 * Get the latest response for each user for a specific question
 */
export async function getLatestUserResponses(surveyId: string, questionId: string) {
  const db = await dbConnect();

  return await db
    .select()
    .from(surveyResponses)
    .where(and(eq(surveyResponses.surveyId, surveyId), eq(surveyResponses.questionId, questionId)))
    .orderBy(surveyResponses.respondedAt);
}
