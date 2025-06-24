import { eq, sql, or, inArray } from 'drizzle-orm'
import { dbConnect } from '@/lib/dbConnect'
import { users, surveyHistory, type User } from '@/db/schema'
import { RelationshipType } from '@/lib/constants/relationships'

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await dbConnect()
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  
  return user || null
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
  const db = await dbConnect()
  
  // Ensure user1Email < user2Email lexicographically for consistent ordering
  const [smallerEmail, largerEmail] = user1Email < user2Email 
    ? [user1Email, user2Email] 
    : [user2Email, user1Email]
  
  // Insert into survey history table
  await db.insert(surveyHistory).values({
    surveyId,
    user1Email: smallerEmail,
    user2Email: largerEmail,
    relationship,
    participatedAt: new Date()
  })
  
  // Increment both users' total surveys taken
  await db
    .update(users)
    .set({ 
      totalSurveysTaken: sql`${users.totalSurveysTaken} + 1`
    })
    .where(or(eq(users.email, user1Email), eq(users.email, user2Email)))
}

/**
 * Get all partner emails that a user has taken surveys with
 */
export async function getSurveyPartners(userEmail: string): Promise<string[]> {
  const db = await dbConnect()
  
  const partners = await db
    .select({ 
      partnerEmail: sql<string>`CASE 
        WHEN ${surveyHistory.user1Email} = ${userEmail} THEN ${surveyHistory.user2Email}
        ELSE ${surveyHistory.user1Email}
      END`.as('partnerEmail')
    })
    .from(surveyHistory)
    .where(or(
      eq(surveyHistory.user1Email, userEmail),
      eq(surveyHistory.user2Email, userEmail)
    ))
  
  return partners.map(p => p.partnerEmail)
}

/**
 * Get user's complete survey history with partner details
 */
export async function getUserSurveyHistory(userEmail: string) {
  const db = await dbConnect()
  
  // Get survey history where this user participated
  const historyWithUser1 = await db
    .select({
      surveyId: surveyHistory.surveyId,
      partnerEmail: surveyHistory.user2Email,
      relationship: surveyHistory.relationship,
      participatedAt: surveyHistory.participatedAt
    })
    .from(surveyHistory)
    .where(eq(surveyHistory.user1Email, userEmail))

  const historyWithUser2 = await db
    .select({
      surveyId: surveyHistory.surveyId,
      partnerEmail: surveyHistory.user1Email,
      relationship: surveyHistory.relationship,
      participatedAt: surveyHistory.participatedAt
    })
    .from(surveyHistory)
    .where(eq(surveyHistory.user2Email, userEmail))

  // Combine both results
  const allHistory = [...historyWithUser1, ...historyWithUser2]

  // Get partner details for each history record
  const partnerEmails = [...new Set(allHistory.map(h => h.partnerEmail))]
  const partners = await db
    .select({
      email: users.email,
      name: users.name
    })
    .from(users)
    .where(inArray(users.email, partnerEmails))

  const partnerMap = new Map(partners.map(p => [p.email, p]))

  // Combine history with partner details
  return allHistory.map(history => ({
    ...history,
    partnerName: partnerMap.get(history.partnerEmail)?.name || 'Unknown',
  })).sort((a, b) => b.participatedAt.getTime() - a.participatedAt.getTime())
}