import 'dotenv/config'
import { eq, inArray } from 'drizzle-orm'
import { db, pool } from './index'
import { permissions, rolePermissions, roles } from './schema'

const CORRECT_PERMS = [
  { name: 'approvals:read',  description: 'View pending approvals' },
  { name: 'approvals:action', description: 'Approve or reject requests' },
  { name: 'users:read',   description: 'View users' },
  { name: 'users:write',  description: 'Edit users' },
  { name: 'users:delete', description: 'Delete users' },
]

async function fixPermissions() {
  // Upsert correct permissions
  for (const p of CORRECT_PERMS) {
    const existing = await db.select().from(permissions).where(eq(permissions.name, p.name))
    if (existing.length === 0) {
      await db.insert(permissions).values(p)
      console.log(`  Created permission: ${p.name}`)
    } else {
      console.log(`  Already exists: ${p.name}`)
    }
  }

  const allPerms = await db.select().from(permissions)
  const permByName = Object.fromEntries(allPerms.map((p) => [p.name, p]))

  const adminRole = (await db.select().from(roles).where(eq(roles.name, 'Admin')))[0]
  const managerRole = (await db.select().from(roles).where(eq(roles.name, 'Manager')))[0]

  if (!adminRole || !managerRole) {
    console.error('Admin or Manager role not found — run seed first.')
    return
  }

  const adminPerms = allPerms.map((p) => p.name)
  const managerPerms = ['approvals:read', 'approvals:action', 'users:read']

  for (const permName of adminPerms) {
    const perm = permByName[permName]
    if (!perm) continue
    await db.insert(rolePermissions).values({ roleId: adminRole.id, permissionId: perm.id }).onConflictDoNothing()
  }
  for (const permName of managerPerms) {
    const perm = permByName[permName]
    if (!perm) continue
    await db.insert(rolePermissions).values({ roleId: managerRole.id, permissionId: perm.id }).onConflictDoNothing()
  }

  console.log('\n✅ Permissions fixed.')
}

fixPermissions()
  .catch((err) => { console.error('Failed:', err); process.exit(1) })
  .finally(() => pool.end())
