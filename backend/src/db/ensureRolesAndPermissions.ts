/**
 * Ensures roles, permissions, and their mappings are present in the DB.
 * Also ensures at least one Admin user exists.
 * Runs on every server startup — idempotent, safe to call multiple times.
 */
import { asc, eq, inArray, isNull, ne, and } from 'drizzle-orm'
import { db } from './index'
import { roles, permissions, rolePermissions, users, userRoles } from './schema'

const ROLE_DEFINITIONS = [
  { name: 'Admin', description: 'Full platform access' },
  { name: 'Manager', description: 'Can approve and manage workflows' },
  { name: 'Employee', description: 'Can create instances and view own tasks' },
] as const

const ALL_PERMISSIONS = [
  { name: 'workflow:read', description: 'View workflows' },
  { name: 'workflow:create', description: 'Create workflows' },
  { name: 'workflow:update', description: 'Edit workflows' },
  { name: 'workflow:delete', description: 'Delete workflows' },
  { name: 'task:read', description: 'View tasks' },
  { name: 'task:update', description: 'Update tasks' },
  { name: 'approvals:read', description: 'View pending approvals' },
  { name: 'approvals:action', description: 'Approve or reject requests' },
  { name: 'audit:read', description: 'View audit logs' },
  { name: 'users:read', description: 'View users' },
  { name: 'users:write', description: 'Edit users' },
  { name: 'users:delete', description: 'Delete users' },
]

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  Admin: ALL_PERMISSIONS.map((p) => p.name),
  Manager: [
    'workflow:read',
    'workflow:create',
    'workflow:update',
    'task:read',
    'task:update',
    'approvals:read',
    'approvals:action',
    'audit:read',
    'users:read',
    'users:write',
  ],
  Employee: ['workflow:read', 'workflow:create', 'task:read', 'task:update'],
}

export async function ensureRolesAndPermissions(): Promise<void> {
  // 1. Upsert roles
  for (const role of ROLE_DEFINITIONS) {
    await db.insert(roles).values(role).onConflictDoNothing({ target: roles.name })
  }

  // 2. Upsert permissions
  for (const perm of ALL_PERMISSIONS) {
    await db.insert(permissions).values(perm).onConflictDoNothing({ target: permissions.name })
  }

  // 3. Re-fetch current state
  const allRoles = await db.select().from(roles)
  const allPerms = await db.select().from(permissions)
  const roleByName = new Map(allRoles.map((r) => [r.name, r.id]))
  const permByName = new Map(allPerms.map((p) => [p.name, p.id]))

  // 4. Upsert role ↔ permission mappings
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleByName.get(roleName)
    if (!roleId) continue
    for (const permName of permNames) {
      const permId = permByName.get(permName)
      if (!permId) continue
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId: permId })
        .onConflictDoNothing()
    }
  }

  // 5. Remove any stale role-permission mappings for known roles
  //    (old strings like 'admin:users', 'approval:approve' etc.)
  const validPermIds = new Set(allPerms.map((p) => p.id))
  const knownRoleIds = [...roleByName.values()]
  if (knownRoleIds.length > 0) {
    const existingMappings = await db
      .select()
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, knownRoleIds))

    const staleIds = existingMappings
      .filter((m) => !validPermIds.has(m.permissionId))
      .map((m) => m.permissionId)

    if (staleIds.length > 0) {
      await db
        .delete(rolePermissions)
        .where(inArray(rolePermissions.permissionId, staleIds))
    }
  }
}

/**
 * If no user has Admin role yet, promote the earliest created non-system user.
 * This auto-bootstraps the first admin on a fresh install.
 */
export async function ensureAtLeastOneAdmin(): Promise<void> {
  const [adminRole] = await db.select().from(roles).where(eq(roles.name, 'Admin')).limit(1)
  if (!adminRole) return

  // Only count real users (not system@nectar.local) as admins
  const realAdmins = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .where(and(eq(userRoles.roleId, adminRole.id), ne(users.email, 'system@nectar.local')))
    .limit(1)

  if (realAdmins.length > 0) return // a real admin already exists

  // No admin — promote the earliest real user
  const [firstUser] = await db
    .select()
    .from(users)
    .where(and(ne(users.email, 'system@nectar.local'), isNull(users.deletedAt)))
    .orderBy(asc(users.createdAt))
    .limit(1)

  if (!firstUser) return

  await db.insert(userRoles).values({ userId: firstUser.id, roleId: adminRole.id }).onConflictDoNothing()

  // Also ensure the user is marked active and approved
  await db
    .update(users)
    .set({ isActive: true, onboardingStatus: 'approved' })
    .where(eq(users.id, firstUser.id))

  console.log(`Auto-promoted first user to Admin: ${firstUser.name} (${firstUser.email})`)
}
