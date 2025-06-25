import { pgTable, uuid, text, timestamp, pgEnum, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { relationshipTypeEnum } from "@/lib/constants/relationships";

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
]);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromUserEmail: text("from_user_email")
      .references(() => users.email)
      .notNull(),
    toUserEmail: text("to_user_email")
      .references(() => users.email)
      .notNull(),
    status: invitationStatusEnum("status").default("pending").notNull(),
    relationship: relationshipTypeEnum("relationship").notNull(),
    sessionId: text("session_id").unique(), // Set when accepted
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at")
      .default(sql`NOW() + INTERVAL '30 minutes'`)
      .notNull(),
  },
  (table) => [
    // Index for finding invitations sent by a user
    index("invitations_from_user_idx").on(table.fromUserEmail),
    // Index for finding pending invitations for a user (most common query)
    index("invitations_to_user_status_idx").on(table.toUserEmail, table.status),
    // Index for expiring old invitations (cleanup job)
    index("invitations_expires_at_idx").on(table.expiresAt),
    // Email validation constraints (Cornell emails only)
    check(
      "from_user_email_check",
      sql`${table.fromUserEmail} LIKE '%@cornell.edu' OR ${table.fromUserEmail} = 'cornell.perfectmatch@gmail.com'`
    ),
    check(
      "to_user_email_check",
      sql`${table.toUserEmail} LIKE '%@cornell.edu' OR ${table.toUserEmail} = 'cornell.perfectmatch@gmail.com'`
    ),
  ]
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
