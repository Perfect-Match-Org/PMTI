import { eq, desc } from "drizzle-orm";
import { dbConnect } from "@/lib/dbConnect";
import {
  coupleTypeAnalytics,
  questionAnalytics,
  type CoupleTypeAnalytic,
  type QuestionAnalytic,
} from "@/db/schema/analytics";
import { CoupleTypeCode } from "@/lib/constants/coupleTypes";

/**
 * Couple Type Analytics Service Functions
 */

/**
 * Increment frequency for a couple type
 */
export async function incrementCoupleTypeFrequency(
  typeCode: CoupleTypeCode
): Promise<CoupleTypeAnalytic> {
  const db = await dbConnect();

  // Try to update existing record first
  const [existingRecord] = await db
    .select()
    .from(coupleTypeAnalytics)
    .where(eq(coupleTypeAnalytics.typeCode, typeCode))
    .limit(1);

  if (existingRecord) {
    const [updatedRecord] = await db
      .update(coupleTypeAnalytics)
      .set({
        frequency: existingRecord.frequency + 1,
      })
      .where(eq(coupleTypeAnalytics.typeCode, typeCode))
      .returning();

    return updatedRecord;
  } else {
    // Create new record if it doesn't exist
    const [newRecord] = await db
      .insert(coupleTypeAnalytics)
      .values({
        typeCode,
        frequency: 1,
      })
      .returning();

    return newRecord;
  }
}

/**
 * Get most popular couple types
 */
export async function getMostPopularCoupleTypes(limit: number = 10): Promise<CoupleTypeAnalytic[]> {
  const db = await dbConnect();

  return await db
    .select()
    .from(coupleTypeAnalytics)
    .orderBy(desc(coupleTypeAnalytics.frequency))
    .limit(limit);
}

/**
 * Get all couple type analytics
 */
export async function getAllCoupleTypeAnalytics(): Promise<CoupleTypeAnalytic[]> {
  const db = await dbConnect();

  return await db.select().from(coupleTypeAnalytics).orderBy(desc(coupleTypeAnalytics.frequency));
}

/**
 * Question Analytics Service Functions
 */

/**
 * Update option frequency for a question
 */
export async function updateQuestionOptionFrequency(
  questionId: string,
  optionId: string
): Promise<QuestionAnalytic> {
  const db = await dbConnect();

  // Try to get existing record first
  const [existingRecord] = await db
    .select()
    .from(questionAnalytics)
    .where(eq(questionAnalytics.questionId, questionId))
    .limit(1);

  if (existingRecord) {
    // Update existing record
    const currentFrequency = existingRecord.optionFrequency as Record<string, number>;
    const updatedFrequency = {
      ...currentFrequency,
      [optionId]: (currentFrequency[optionId] || 0) + 1,
    };

    const [updatedRecord] = await db
      .update(questionAnalytics)
      .set({
        optionFrequency: updatedFrequency,
      })
      .where(eq(questionAnalytics.questionId, questionId))
      .returning();

    return updatedRecord;
  } else {
    // Create new record if it doesn't exist
    const [newRecord] = await db
      .insert(questionAnalytics)
      .values({
        questionId,
        optionFrequency: { [optionId]: 1 },
      })
      .returning();

    return newRecord;
  }
}

/**
 * Get all question analytics
 */
export async function getAllQuestionAnalytics(): Promise<QuestionAnalytic[]> {
  const db = await dbConnect();

  return await db.select().from(questionAnalytics);
}

/**
 * Get analytics for a specific question
 */
export async function getQuestionAnalytics(questionId: string): Promise<QuestionAnalytic | null> {
  const db = await dbConnect();

  const [record] = await db
    .select()
    .from(questionAnalytics)
    .where(eq(questionAnalytics.questionId, questionId))
    .limit(1);

  return record || null;
}

/**
 * Get analytics for a specific couple type
 */
export async function getCoupleTypeAnalytics(
  typeCode: CoupleTypeCode
): Promise<CoupleTypeAnalytic | null> {
  const db = await dbConnect();

  const [record] = await db
    .select()
    .from(coupleTypeAnalytics)
    .where(eq(coupleTypeAnalytics.typeCode, typeCode))
    .limit(1);

  return record || null;
}
