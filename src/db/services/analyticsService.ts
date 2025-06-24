import { eq, desc, sql } from "drizzle-orm";
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

  const [record] = await db
    .insert(coupleTypeAnalytics)
    .values({
      typeCode,
      frequency: 1,
    })
    .onConflictDoUpdate({
      target: coupleTypeAnalytics.typeCode,
      set: {
        frequency: sql`${coupleTypeAnalytics.frequency} + 1`,
      },
    })
    .returning();

  return record;
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

  // Use atomic UPSERT with JSON operations to handle race conditions
  const [record] = await db
    .insert(questionAnalytics)
    .values({
      questionId,
      optionFrequency: { [optionId]: 1 },
    })
    .onConflictDoUpdate({
      target: questionAnalytics.questionId,
      set: {
        optionFrequency: sql`json_set(
          COALESCE(${questionAnalytics.optionFrequency}, '{}'),
          '$.' || ${optionId},
          COALESCE(json_extract(${questionAnalytics.optionFrequency}, '$.' || ${optionId}), 0) + 1
        )`,
      },
    })
    .returning();

  return record;
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
