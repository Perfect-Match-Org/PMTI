import { pgTable, uuid, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { users } from "./user";
import { surveys } from "./survey";

export const feedbackRatingEnum = pgEnum("feedback_rating", ["positive", "negative"]);

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  surveyId: uuid()
    .references(() => surveys.id)
    .notNull(),
  userEmail: text()
    .references(() => users.email)
    .notNull(),
  rating: feedbackRatingEnum().notNull(),
  accuracyRating: integer(), // 1-5 scale
  enjoymentRating: integer(), // 1-5 scale
  comments: text(), // max 5000 chars enforced at app level
  submittedAt: timestamp().defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
