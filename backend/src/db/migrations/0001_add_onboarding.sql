ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_status" varchar(50) DEFAULT 'approved' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" varchar(100);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
	CONSTRAINT "onboarding_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
);
