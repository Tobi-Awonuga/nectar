-- Add owner_department and visibility to workflow_instances
ALTER TABLE "workflow_instances"
  ADD COLUMN IF NOT EXISTS "owner_department" varchar(100),
  ADD COLUMN IF NOT EXISTS "visibility" varchar(20) DEFAULT 'public' NOT NULL;
