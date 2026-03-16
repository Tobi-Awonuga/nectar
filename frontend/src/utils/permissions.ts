// Permission name constants — match the backend permission.name values
export const PERMISSIONS = {
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_ADMIN: 'workflow:admin',
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_APPROVE: 'task:approve',
  AUDIT_READ: 'audit:read',
  USERS_ADMIN: 'users:admin',
  ROLES_ADMIN: 'roles:admin',
} as const
