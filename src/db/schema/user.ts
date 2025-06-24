import { pgTable, text, integer, boolean, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  email: text('email').primaryKey(),
  name: text('name').notNull(),
  totalSurveysTaken: integer('total_surveys_taken').default(0).notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  hasRegistered: boolean('has_registered').default(false).notNull()
}, (table) => [
  // Email validation constraint (Cornell emails only)
  check(
    'user_email_check', 
    sql`${table.email} LIKE '%@cornell.edu' OR ${table.email} = 'cornell.perfectmatch@gmail.com'`
  ),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert