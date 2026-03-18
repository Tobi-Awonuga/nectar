-- Insert all required permission strings (idempotent)
INSERT INTO "permissions" ("name") VALUES
  ('workflow:read'),
  ('workflow:create'),
  ('workflow:update'),
  ('workflow:delete'),
  ('task:read'),
  ('task:update'),
  ('approvals:read'),
  ('approvals:action'),
  ('audit:read'),
  ('users:read'),
  ('users:write'),
  ('users:delete')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- Admin: all permissions
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r, "permissions" p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Manager permissions
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
JOIN "permissions" p ON p.name IN (
  'workflow:read', 'workflow:create', 'workflow:update',
  'task:read', 'task:update',
  'approvals:read', 'approvals:action',
  'audit:read',
  'users:read'
)
WHERE r.name = 'Manager'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Employee permissions
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
JOIN "permissions" p ON p.name IN (
  'workflow:read', 'workflow:create',
  'task:read', 'task:update'
)
WHERE r.name = 'Employee'
ON CONFLICT DO NOTHING;
