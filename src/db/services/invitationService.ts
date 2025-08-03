import { eq, and, desc, sql } from "drizzle-orm";
import { dbConnect } from "@/lib/dbConnect";
import { invitations, users, surveys, surveyHistory, type Invitation } from "@/db/schema";
import { RelationshipType } from "@/lib/constants/relationships";
import { OutboundInvitation } from "@/types/invitation";

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
 * Accept an invitation, generate a survey ID, and create the survey
 */
export async function acceptInvitation(invitationId: string): Promise<Invitation> {
  const db = await dbConnect();

  // Get the invitation first to access user emails
  const invitation = await getInvitationById(invitationId);
  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Create survey and update invitation in a single transaction
  const result = await db.transaction(async (tx) => {
    const [newSurvey] = await tx
      .insert(surveys)
      .values({
        startedAt: new Date(),
        status: "started",
        currentQuestionIndex: 0,
        participantStatus: {
          [invitation.fromUserEmail]: { hasSubmitted: false },
          [invitation.toUserEmail]: { hasSubmitted: false },
        },
      })
      .returning();

    // Update invitation with accepted status and the generated surveyId
    const [updatedInvitation] = await tx
      .update(invitations)
      .set({
        status: "accepted",
        surveyId: newSurvey.id,
      })
      .where(eq(invitations.id, invitationId))
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
      surveyId: invitations.surveyId,
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
export async function getSentInvitations(
  email: string,
  limit: number = 1
): Promise<OutboundInvitation[]> {
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
      surveyId: invitations.surveyId,
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
 * Get invitation by survey ID
 */
export async function getInvitationBySurveyId(surveyId: string): Promise<Invitation | null> {
  const db = await dbConnect();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.surveyId, surveyId))
    .limit(1);

  return invitation || null;
}

/**
 * Validate if user has access to a survey session
 */
export async function validateSurveyAccess(surveyId: string, userEmail: string): Promise<boolean> {
  const invitation = await getInvitationBySurveyId(surveyId);

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
