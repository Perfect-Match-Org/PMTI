CREATE TYPE "public"."couple_type_code" AS ENUM('ADVENTUROUS_PLANNERS', 'COZY_HOMEBODIES', 'SOCIAL_BUTTERFLIES', 'THOUGHTFUL_DEEP_THINKERS', 'SPONTANEOUS_ADVENTURERS', 'BALANCED_PARTNERS', 'CREATIVE_COLLABORATORS', 'SUPPORTIVE_COMPANIONS', 'AMBITIOUS_ACHIEVERS', 'RELAXED_ROMANTICS', 'INTELLECTUAL_EXPLORERS', 'PRACTICAL_PARTNERS', 'PLAYFUL_COMPANIONS', 'MINDFUL_MATCHES', 'INDEPENDENT_TOGETHER', 'TRADITIONAL_SWEETHEARTS');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('couple', 'situationship', 'besties', 'just_friends');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('started', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."feedback_rating" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TABLE "users" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_surveys_taken" integer DEFAULT 0 NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_email_check" CHECK ("users"."email" LIKE '%@cornell.edu' OR "users"."email" = 'cornell.perfectmatch@gmail.com')
);
--> statement-breakpoint
CREATE TABLE "survey_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"user1_email" text NOT NULL,
	"user2_email" text NOT NULL,
	"relationship" "relationship_type" NOT NULL,
	"participated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_order_check" CHECK ("survey_participants"."user1_email" < "survey_participants"."user2_email")
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_option" text NOT NULL,
	"responded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"status" "survey_status" DEFAULT 'started' NOT NULL,
	"survey_version" text DEFAULT '1.0' NOT NULL,
	"current_question_index" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"couple_type" "couple_type_code",
	"participant_scores" jsonb,
	"compatibility" jsonb,
	CONSTRAINT "surveys_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_email" text NOT NULL,
	"to_user_email" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"relationship" "relationship_type" NOT NULL,
	"session_id" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '30 minutes' NOT NULL,
	CONSTRAINT "invitations_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "from_user_email_check" CHECK ("invitations"."from_user_email" LIKE '%@cornell.edu' OR "invitations"."from_user_email" = 'cornell.perfectmatch@gmail.com'),
	CONSTRAINT "to_user_email_check" CHECK ("invitations"."to_user_email" LIKE '%@cornell.edu' OR "invitations"."to_user_email" = 'cornell.perfectmatch@gmail.com')
);
--> statement-breakpoint
CREATE TABLE "couple_type_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_code" "couple_type_code" NOT NULL,
	"frequency" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "couple_type_analytics_type_code_unique" UNIQUE("type_code")
);
--> statement-breakpoint
CREATE TABLE "question_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" text NOT NULL,
	"option_frequency" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "question_analytics_question_id_unique" UNIQUE("question_id")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"rating" "feedback_rating" NOT NULL,
	"accuracy_rating" integer,
	"enjoyment_rating" integer,
	"comments" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_user1_email_users_email_fk" FOREIGN KEY ("user1_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_participants" ADD CONSTRAINT "survey_participants_user2_email_users_email_fk" FOREIGN KEY ("user2_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_from_user_email_users_email_fk" FOREIGN KEY ("from_user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_to_user_email_users_email_fk" FOREIGN KEY ("to_user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survey_participants_users_idx" ON "survey_participants" USING btree ("user1_email","user2_email");--> statement-breakpoint
CREATE INDEX "survey_participants_user1_idx" ON "survey_participants" USING btree ("user1_email");--> statement-breakpoint
CREATE INDEX "survey_participants_user2_idx" ON "survey_participants" USING btree ("user2_email");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_question_idx" ON "survey_responses" USING btree ("survey_id","question_id");--> statement-breakpoint
CREATE INDEX "surveys_status_idx" ON "surveys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "surveys_completed_at_idx" ON "surveys" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "surveys_couple_type_idx" ON "surveys" USING btree ("couple_type");--> statement-breakpoint
CREATE INDEX "invitations_from_user_idx" ON "invitations" USING btree ("from_user_email");--> statement-breakpoint
CREATE INDEX "invitations_to_user_status_idx" ON "invitations" USING btree ("to_user_email","status");--> statement-breakpoint
CREATE INDEX "invitations_expires_at_idx" ON "invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "couple_type_analytics_frequency_idx" ON "couple_type_analytics" USING btree ("frequency");