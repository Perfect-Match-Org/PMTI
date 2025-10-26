import { pgTable, uuid, text, integer, jsonb, index } from "drizzle-orm/pg-core";
import { coupleTypeEnum } from "@/lib/constants/coupleTypes";

export const coupleTypeAnalytics = pgTable(
  "couple_type_analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typeCode: coupleTypeEnum().notNull().unique(),
    frequency: integer("frequency").default(0).notNull(),
  },
  (table) => [
    // Index for finding most popular couple types
    index("couple_type_analytics_frequency_idx").on(table.frequency),
  ]
);

export const questionAnalytics = pgTable("question_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: text().notNull().unique(),
  optionFrequency: jsonb().$type<Record<string, number>>().default({}).notNull(),
});

export type CoupleTypeAnalytic = typeof coupleTypeAnalytics.$inferSelect;
export type NewCoupleTypeAnalytic = typeof coupleTypeAnalytics.$inferInsert;

export type QuestionAnalytic = typeof questionAnalytics.$inferSelect;
export type NewQuestionAnalytic = typeof questionAnalytics.$inferInsert;
