import { eq, sql, or, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { dbConnect } from "@/lib/dbConnect";
import { users, surveyHistory, type User } from "@/db/schema";
import { RelationshipType } from "@/lib/constants/relationships";

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await dbConnect();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return user || null;
}

/**
 * Create or update user during authentication
 * Optimized for the common case of existing registered users
 */
export async function createOrUpdateUser(email: string, name?: string): Promise<User> {
  const db = await dbConnect();

  const existingUser = await getUserByEmail(email);
  if (existingUser?.hasRegistered) {
    return existingUser;
  }

  // Only do UPSERT for new users or unregistered users
  const actualName = name || email.split("@")[0];

  const [user] = await db
    .insert(users)
    .values({
      email,
      name: actualName,
      hasRegistered: true,
    })
    .onConflictDoUpdate({
      // Case when user entry was created by an invitation but not registered
      target: users.email,
      set: {
        name: actualName,
        hasRegistered: true,
      },
    })
    .returning();

  return user;
}

/**
 * Add a survey to user's history and increment survey count
 * Note: With the new normalized schema, this creates a record in surveyHistory table
 * We ensure user1Email is always lexicographically smaller than user2Email
 */
export async function addSurveyToHistory(
  user1Email: string,
  user2Email: string,
  surveyId: string,
  relationship: RelationshipType
): Promise<void> {
  const db = await dbConnect();

  // Ensure user1Email < user2Email lexicographically for consistent ordering
  const [smallerEmail, largerEmail] =
    user1Email < user2Email ? [user1Email, user2Email] : [user2Email, user1Email];

  // Insert into survey history table
  await db.insert(surveyHistory).values({
    surveyId,
    user1Email: smallerEmail,
    user2Email: largerEmail,
    relationship,
    participatedAt: new Date(),
  });

  // Increment both users' total surveys taken
  await db
    .update(users)
    .set({
      totalSurveysTaken: sql`${users.totalSurveysTaken} + 1`,
    })
    .where(inArray(users.email, [user1Email, user2Email]));
}

/**
 * Get all partner emails that a user has taken surveys with
 */
export async function getSurveyPartners(userEmail: string): Promise<string[]> {
  const db = await dbConnect();

  const partners = await db
    .select({
      partnerEmail: sql<string>`CASE 
        WHEN ${surveyHistory.user1Email} = ${userEmail} THEN ${surveyHistory.user2Email}
        ELSE ${surveyHistory.user1Email}
      END`.as("partnerEmail"),
    })
    .from(surveyHistory)
    .where(or(eq(surveyHistory.user1Email, userEmail), eq(surveyHistory.user2Email, userEmail)));

  return partners.map((p) => p.partnerEmail);
}

/**
 * Get user's complete survey history with partner details
 */
export async function getUserSurveyHistory(userEmail: string) {
  const db = await dbConnect();

  // Create aliases for multiple user joins
  const user1 = alias(users, "user1");
  const user2 = alias(users, "user2");

  // Use single query with JOINs to get all data at once
  const history = await db
    .select({
      surveyId: surveyHistory.surveyId,
      partnerEmail: sql<string>`CASE 
        WHEN ${surveyHistory.user1Email} = ${userEmail} THEN ${surveyHistory.user2Email}
        ELSE ${surveyHistory.user1Email}
      END`.as("partnerEmail"),
      partnerName: sql<string>`CASE 
        WHEN ${surveyHistory.user1Email} = ${userEmail} THEN ${user2.name}
        ELSE ${user1.name}
      END`.as("partnerName"),
      relationship: surveyHistory.relationship,
      participatedAt: surveyHistory.participatedAt,
    })
    .from(surveyHistory)
    .leftJoin(user1, eq(surveyHistory.user1Email, user1.email))
    .leftJoin(user2, eq(surveyHistory.user2Email, user2.email))
    .where(or(eq(surveyHistory.user1Email, userEmail), eq(surveyHistory.user2Email, userEmail)))
    .orderBy(sql`${surveyHistory.participatedAt} DESC`);

  return history;
}
