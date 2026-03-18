CREATE TABLE IF NOT EXISTS "department_default_assignees" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "department" varchar(100) NOT NULL UNIQUE,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "updated_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
