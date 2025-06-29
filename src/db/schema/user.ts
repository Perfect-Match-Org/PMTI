import { pgTable, text, integer, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    email: text("email").primaryKey(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    totalSurveysTaken: integer().default(0).notNull(),
    emailNotifications: boolean().default(true).notNull(),
    hasRegistered: boolean().default(false).notNull(),
  },
  (table) => [
    // Email validation constraint (Cornell emails only)
    check(
      "user_email_check",
      sql`${table.email} LIKE '%@cornell.edu' OR ${table.email} = 'cornell.perfectmatch@gmail.com'`
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
