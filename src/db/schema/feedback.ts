import { pgTable, uuid, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { users } from "./user";
import { surveys } from "./survey";

export const feedbackRatingEnum = pgEnum("feedback_rating", ["positive", "negative"]);

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  surveyId: uuid("survey_id")
    .references(() => surveys.id)
    .notNull(),
  userEmail: text("user_email")
    .references(() => users.email)
    .notNull(),
  rating: feedbackRatingEnum("rating").notNull(),
  accuracyRating: integer("accuracy_rating"), // 1-5 scale
  enjoymentRating: integer("enjoyment_rating"), // 1-5 scale
  comments: text("comments"), // max 5000 chars enforced at app level
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
