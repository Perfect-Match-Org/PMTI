import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { relationshipTypeEnum } from "@/lib/constants/relationships";
import { coupleTypeEnum, type ScoreWeights } from "@/lib/constants/coupleTypes";
import { ParticipantStatus } from "@/types/survey";

export const surveyStatusEnum = pgEnum("survey_status", ["started", "completed", "abandoned"]);
export type SurveyStatus = (typeof surveyStatusEnum.enumValues)[number];

export const surveys = pgTable(
  "surveys",
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: text().notNull().unique(),
    startedAt: timestamp().defaultNow().notNull(),
    completedAt: timestamp(),
    duration: integer(), // in seconds
    status: surveyStatusEnum().default("started").notNull(),
    surveyVersion: text().default("1.0").notNull(),

    // Current progress (for reconnection handling)
    currentQuestionIndex: integer().default(0).notNull(),
    lastActivityAt: timestamp().defaultNow().notNull(),

    // Real-time survey state for participant synchronization
    participantStatus: jsonb().$type<Record<string, ParticipantStatus>>(),

    coupleType: coupleTypeEnum("couple_type"),
    participantScores: jsonb("participant_scores").$type<Record<string, ScoreWeights>>(), // userId -> scores
    compatibility: jsonb("compatibility").$type<{
      overallScore: number;
      dimensions: ScoreWeights;
    }>(),
  },
  (table) => [
    // Index for filtering surveys by status (started, completed, abandoned)
    index("surveys_status_idx").on(table.status),
    // Index for finding completed surveys by date (analytics, recent activity)
    index("surveys_completed_at_idx").on(table.completedAt),
    // Index for analytics queries by couple type
    index("surveys_couple_type_idx").on(table.coupleType),
  ]
);

// Junction table for many-to-many relationship between users and surveys
export const surveyHistory = pgTable(
  "survey_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid()
      .references(() => surveys.id)
      .notNull(),
    user1Email: text()
      .references(() => users.email)
      .notNull(), // Always the lexicographically smaller email
    user2Email: text()
      .references(() => users.email)
      .notNull(), // Always the lexicographically larger email
    relationship: relationshipTypeEnum().notNull(),
    participatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    // Database-level constraint to enforce user1Email < user2Email
    check("email_order_check", sql`${table.user1Email} < ${table.user2Email}`),
    // Index for finding surveys between two users (most common query)
    index("survey_participants_users_idx").on(table.user1Email, table.user2Email),
    // Index for finding all surveys a user participated in
    index("survey_participants_user1_idx").on(table.user1Email),
    index("survey_participants_user2_idx").on(table.user2Email),
  ]
);

export const surveyResponses = pgTable(
  "survey_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid()
      .references(() => surveys.id)
      .notNull(),
    userEmail: text()
      .references(() => users.email)
      .notNull(),
    questionId: text().notNull(),
    selectedOption: text().notNull(),
    respondedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    // Index for getting all responses for a survey (most common query)
    index("survey_responses_survey_idx").on(table.surveyId),
    // Index for getting responses by survey and question (quiz progress)
    index("survey_responses_survey_question_idx").on(table.surveyId, table.questionId),
  ]
);

export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;

export type SurveyHistory = typeof surveyHistory.$inferSelect;
export type NewSurveyHistory = typeof surveyHistory.$inferInsert;

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof surveyResponses.$inferInsert;
