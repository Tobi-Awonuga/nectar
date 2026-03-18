ALTER TABLE "workflow_instances"
  ADD COLUMN IF NOT EXISTS "owner_user_id" uuid REFERENCES "users"("id");

CREATE TABLE IF NOT EXISTS "request_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instance_id" uuid NOT NULL REFERENCES "workflow_instances"("id") ON DELETE CASCADE,
  "participant_type" varchar(20) NOT NULL,
  "participant_scope" varchar(20) NOT NULL,
  "department" varchar(100),
  "user_id" uuid REFERENCES "users"("id"),
  "added_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
