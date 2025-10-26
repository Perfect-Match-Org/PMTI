CREATE TYPE "public"."couple_type_code" AS ENUM('ADVENTUROUS_PLANNERS', 'COZY_HOMEBODIES', 'SOCIAL_BUTTERFLIES', 'THOUGHTFUL_DEEP_THINKERS', 'SPONTANEOUS_ADVENTURERS', 'BALANCED_PARTNERS', 'CREATIVE_COLLABORATORS', 'SUPPORTIVE_COMPANIONS', 'AMBITIOUS_ACHIEVERS', 'RELAXED_ROMANTICS', 'INTELLECTUAL_EXPLORERS', 'PRACTICAL_PARTNERS', 'PLAYFUL_COMPANIONS', 'MINDFUL_MATCHES', 'INDEPENDENT_TOGETHER', 'TRADITIONAL_SWEETHEARTS');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('couple', 'situationship', 'besties', 'just_friends');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('started', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."feedback_rating" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TABLE "users" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"totalSurveysTaken" integer DEFAULT 0 NOT NULL,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"hasRegistered" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_check" CHECK ("users"."email" LIKE '%@cornell.edu' OR "users"."email" = 'cornell.perfectmatch@gmail.com')
);
--> statement-breakpoint
CREATE TABLE "survey_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surveyId" uuid NOT NULL,
	"user1Email" text NOT NULL,
	"user2Email" text NOT NULL,
	"relationship" "relationship_type" NOT NULL,
	"participatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_order_check" CHECK ("survey_participants"."user1Email" < "survey_participants"."user2Email")
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surveyId" uuid NOT NULL,
	"userEmail" text NOT NULL,
	"questionId" text NOT NULL,
	"selectedOption" text NOT NULL,
	"respondedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"duration" integer,
	"status" "survey_status" DEFAULT 'started' NOT NULL,
	"surveyVersion" text DEFAULT '1.0' NOT NULL,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"participant_status" jsonb,
	"couple_type" "couple_type_code",
	"participant_scores" jsonb,
	"compatibility" jsonb
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fromUserEmail" text NOT NULL,
	"toUserEmail" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"relationship" "relationship_type" NOT NULL,
	"survey_id" uuid,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp DEFAULT NOW() + INTERVAL '30 minutes' NOT NULL,
	CONSTRAINT "from_user_email_check" CHECK ("invitations"."fromUserEmail" LIKE '%@cornell.edu' OR "invitations"."fromUserEmail" = 'cornell.perfectmatch@gmail.com'),
	CONSTRAINT "to_user_email_check" CHECK ("invitations"."toUserEmail" LIKE '%@cornell.edu' OR "invitations"."toUserEmail" = 'cornell.perfectmatch@gmail.com')
);
--> statement-breakpoint
CREATE TABLE "couple_type_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"typeCode" "couple_type_code" NOT NULL,
	"frequency" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "couple_type_analytics_typeCode_unique" UNIQUE("typeCode")
);
--> statement-breakpoint
CREATE TABLE "question_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionId" text NOT NULL,
	"optionFrequency" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "question_analytics_questionId_unique" UNIQUE("questionId")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surveyId" uuid NOT NULL,
	"userEmail" text NOT NULL,
	"rating" "feedback_rating" NOT NULL,
	"accuracyRating" integer,
	"enjoymentRating" integer,
	"comments" text,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_surveyId_surveys_id_fk" FOREIGN KEY ("surveyId") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_user1Email_users_email_fk" FOREIGN KEY ("user1Email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_user2Email_users_email_fk" FOREIGN KEY ("user2Email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_surveys_id_fk" FOREIGN KEY ("surveyId") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_fromUserEmail_users_email_fk" FOREIGN KEY ("fromUserEmail") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_toUserEmail_users_email_fk" FOREIGN KEY ("toUserEmail") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_surveyId_surveys_id_fk" FOREIGN KEY ("surveyId") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_participants_users_idx" ON "survey_participants" USING btree ("user1Email","user2Email");--> statement-breakpoint
CREATE INDEX "survey_participants_user1_idx" ON "survey_participants" USING btree ("user1Email");--> statement-breakpoint
CREATE INDEX "survey_participants_user2_idx" ON "survey_participants" USING btree ("user2Email");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_idx" ON "survey_responses" USING btree ("surveyId");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_question_idx" ON "survey_responses" USING btree ("surveyId","questionId");--> statement-breakpoint
CREATE INDEX "surveys_status_idx" ON "surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surveys_completed_at_idx" ON "surveys" USING btree ("completedAt");--> statement-breakpoint
CREATE INDEX "surveys_couple_type_idx" ON "surveys" USING btree ("couple_type");--> statement-breakpoint
CREATE INDEX "invitations_from_user_idx" ON "invitations" USING btree ("fromUserEmail");--> statement-breakpoint
CREATE INDEX "invitations_to_user_status_idx" ON "invitations" USING btree ("toUserEmail","status");--> statement-breakpoint
CREATE INDEX "invitations_expires_at_idx" ON "invitations" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "couple_type_analytics_frequency_idx" ON "couple_type_analytics" USING btree ("frequency");