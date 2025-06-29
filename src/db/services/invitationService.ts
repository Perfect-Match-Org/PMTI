import { eq, and, desc, sql } from "drizzle-orm";
import { dbConnect } from "@/lib/dbConnect";
import { invitations, users, surveys, surveyHistory, type Invitation } from "@/db/schema";
import { randomUUID } from "crypto";
import { RelationshipType } from "@/lib/constants/relationships";

function isExpiredHelper(invitation: Invitation): boolean {
  return new Date() > invitation.expiresAt;
}

/**
 * Check if an invitation is expired
 */
export async function isExpired(invitationId: string): Promise<boolean> {
  const db = await dbConnect();
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    console.error("Invitation not found:", invitationId);
    return true; // Treat non-existent invitations as expired
  }
  return isExpiredHelper(invitation);
}

/**
 * Accept an invitation, generate a session ID, and create the survey
 */
export async function acceptInvitation(invitationId: string): Promise<Invitation> {
  const db = await dbConnect();

  // Get the invitation first to access user emails
  const invitation = await getInvitationById(invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Retry up to 3 times in case of UUID collision (extremely rare)
  for (let attempt = 0; attempt < 3; attempt++) {
    const sessionId = `session_${randomUUID()}`;
    try {
      // Create survey and update invitation in a single transaction
      const result = await db.transaction(async (tx) => {
        // Update invitation with accepted status and sessionId
        const [updatedInvitation] = await tx
          .update(invitations)
          .set({
            status: "accepted",
            sessionId: sessionId,
          })
          .where(eq(invitations.id, invitationId))
          .returning();

        // Create the survey immediately
        const [newSurvey] = await tx
          .insert(surveys)
          .values({
            sessionId,
            startedAt: new Date(),
            status: "started",
            currentQuestionIndex: 0,
            participantStatus: {},
          })
          .returning();

        // Determine user order (lexicographic for consistency)
        const user1Email =
          invitation.fromUserEmail < invitation.toUserEmail
            ? invitation.fromUserEmail
            : invitation.toUserEmail;
        const user2Email =
          invitation.fromUserEmail < invitation.toUserEmail
            ? invitation.toUserEmail
            : invitation.fromUserEmail;

        // Create survey history record
        await tx.insert(surveyHistory).values({
          surveyId: newSurvey.id,
          user1Email,
          user2Email,
          relationship: invitation.relationship,
        });

        return updatedInvitation;
      });

      return result;
    } catch (error: unknown) {
      // This is extremely rare to trigger.
      // It handles the case where a UUID collision occurs
      if (error && typeof error === "object" && "code" in error && "constraint" in error) {
        const dbError = error as { code: string; constraint?: string };
        if (dbError.code === "23505" && dbError.constraint?.includes("session_id")) {
          if (attempt === 2) {
            throw new Error("Failed to generate unique session ID after 3 attempts");
          }
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error("Failed to accept invitation");
}

/**
 * Decline an invitation
 */
export async function declineInvitation(invitationId: string): Promise<Invitation> {
  const db = await dbConnect();

  const [updatedInvitation] = await db
    .update(invitations)
    .set({ status: "declined" })
    .where(eq(invitations.id, invitationId))
    .returning();

  return updatedInvitation;
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<Invitation> {
  const db = await dbConnect();

  const [updatedInvitation] = await db
    .update(invitations)
    .set({ status: "cancelled" })
    .where(eq(invitations.id, invitationId))
    .returning();

  return updatedInvitation;
}

/**
 * Get received invitations for a user by email (excludes expired)
 */
export async function getReceivedInvitations(email: string, limit: number = 10) {
  const db = await dbConnect();

  // Get received invitations with sender information, excluding expired ones
  return await db
    .select({
      id: invitations.id,
      fromUser: {
        email: users.email,
        name: users.name,
        avatar: users.avatar,
      },
      status: invitations.status,
      relationship: invitations.relationship,
      sentAt: invitations.sentAt,
      expiresAt: invitations.expiresAt,
      sessionId: invitations.sessionId,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.fromUserEmail, users.email))
    .where(
      and(
        eq(invitations.toUserEmail, email),
        eq(invitations.status, "pending"),
        sql`${invitations.expiresAt} > NOW()` // Only non-expired invitations
      )
    )
    .orderBy(desc(invitations.sentAt))
    .limit(limit);
}

/**
 * Get pending invitation by sender and recipient email
 */
export async function getPendingInvitation(
  fromUserEmail: string,
  toEmail: string
): Promise<Invitation | null> {
  const db = await dbConnect();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.fromUserEmail, fromUserEmail),
        eq(invitations.toUserEmail, toEmail),
        eq(invitations.status, "pending")
      )
    )
    .limit(1);

  return invitation || null;
}

/**
 * Get sent invitations for a user by email (excludes expired)
 */
export async function getSentInvitations(email: string, limit: number = 1) {
  const db = await dbConnect();

  return await db
    .select({
      id: invitations.id,
      toUser: {
        email: users.email,
        name: users.name,
        avatar: users.avatar,
      },
      status: invitations.status,
      relationship: invitations.relationship,
      sentAt: invitations.sentAt,
      expiresAt: invitations.expiresAt,
      sessionId: invitations.sessionId,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.toUserEmail, users.email))
    .where(
      and(
        eq(invitations.fromUserEmail, email),
        eq(invitations.status, "pending"),
        sql`${invitations.expiresAt} > NOW()` // Only non-expired invitations
      )
    )
    .orderBy(desc(invitations.sentAt))
    .limit(limit);
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(invitationId: string): Promise<Invitation | null> {
  const db = await dbConnect();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  return invitation || null;
}

/**
 * Get invitation by session ID
 */
export async function getInvitationBySessionId(sessionId: string): Promise<Invitation | null> {
  const db = await dbConnect();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.sessionId, sessionId))
    .limit(1);

  return invitation || null;
}

/**
 * Validate if user has access to a survey session
 */
export async function validateSurveyAccess(sessionId: string, userEmail: string): Promise<boolean> {
  const invitation = await getInvitationBySessionId(sessionId);

  if (!invitation) {
    return false;
  }

  // Check if user is either the sender or recipient of the invitation
  return invitation.fromUserEmail === userEmail || invitation.toUserEmail === userEmail;
}

/**
 * Create a new invitation
 */
export async function createInvitation(data: {
  fromUserEmail: string;
  toEmail: string;
  relationship: RelationshipType;
}): Promise<Invitation> {
  const db = await dbConnect();

  // Use transaction to ensure data consistency
  return await db.transaction(async (tx) => {
    // Ensure the recipient user exists using UPSERT
    await tx
      .insert(users)
      .values({
        email: data.toEmail,
        name: data.toEmail.split("@")[0], // Use email prefix as default name
        hasRegistered: false,
      })
      .onConflictDoNothing();

    // Create invitation (expiresAt will default to NOW() + 30 minutes from schema)
    const [invitation] = await tx
      .insert(invitations)
      .values({
        fromUserEmail: data.fromUserEmail,
        toUserEmail: data.toEmail,
        relationship: data.relationship,
      })
      .returning();

    return invitation;
  });
}
