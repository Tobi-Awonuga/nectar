import 'dotenv/config'
import { ilike, eq } from 'drizzle-orm'
import { db, pool } from './index'
import { users, roles, userRoles } from './schema'

async function checkUser() {
  const matchingUsers = await db
    .select()
    .from(users)
    .where(ilike(users.name, '%tobi%'))

  if (matchingUsers.length === 0) {
    console.log('No user matching "tobi" found.')
    return
  }

  for (const user of matchingUsers) {
    const userRoleRows = await db
      .select({ roleName: roles.name, roleId: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, user.id))

    console.log(`\nUser: ${user.name} (${user.email})`)
    console.log(`  ID: ${user.id}`)
    console.log(`  isActive: ${user.isActive}`)
    console.log(`  onboardingStatus: ${(user as Record<string, unknown>).onboardingStatus ?? 'N/A'}`)
    console.log(`  Roles: ${userRoleRows.length === 0 ? '(none)' : userRoleRows.map(r => r.roleName).join(', ')}`)
  }
}

checkUser()
  .catch((err) => { console.error('Failed:', err); process.exit(1) })
  .finally(() => pool.end())
