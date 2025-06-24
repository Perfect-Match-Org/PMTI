// Export all schemas
export * from "./user";
export * from "./survey";
export * from "./invitation";
export * from "./analytics";
export * from "./feedback";

// Export enums explicitly for drizzle ORM to recognize and generate types
export { relationshipTypeEnum } from "@/lib/constants/relationships";
export { coupleTypeEnum } from "@/lib/constants/coupleTypes";

// Relations
import { relations } from "drizzle-orm";
import { users } from "./user";
import { surveys, surveyHistory, surveyResponses } from "./survey";
import { invitations } from "./invitation";
import { feedback } from "./feedback";

export const usersRelations = relations(users, ({ many }) => ({
  sentInvitations: many(invitations),
  receivedFeedback: many(feedback),
  surveyResponses: many(surveyResponses),
  surveyParticipations: many(surveyHistory, { relationName: "user1" }),
  surveyParticipationsAsUser2: many(surveyHistory, { relationName: "user2" }),
}));

export const surveysRelations = relations(surveys, ({ many }) => ({
  histories: many(surveyHistory),
  responses: many(surveyResponses),
  feedback: many(feedback),
}));

export const surveyHistoryRelations = relations(surveyHistory, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyHistory.surveyId],
    references: [surveys.id],
  }),
  user1: one(users, {
    fields: [surveyHistory.user1Email],
    references: [users.email],
    relationName: "user1",
  }),
  user2: one(users, {
    fields: [surveyHistory.user2Email],
    references: [users.email],
    relationName: "user2",
  }),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [surveyResponses.userEmail],
    references: [users.email],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  fromUser: one(users, {
    fields: [invitations.fromUserEmail],
    references: [users.email],
  }),
  toUser: one(users, {
    fields: [invitations.toUserEmail],
    references: [users.email],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  survey: one(surveys, {
    fields: [feedback.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [feedback.userEmail],
    references: [users.email],
  }),
}));
