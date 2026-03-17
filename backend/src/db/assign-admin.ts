import 'dotenv/config'
import { ilike } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { db, pool } from './index'
import { users, roles, userRoles } from './schema'

async function assignAdmin() {
  // Find Tobi's user
  const matchingUsers = await db
    .select()
    .from(users)
    .where(ilike(users.name, '%tobi%'))

  if (matchingUsers.length === 0) {
    console.error('No user matching "tobi" found. Users in DB:')
    const all = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    console.table(all)
    return
  }

  const [adminRole] = await db.select().from(roles).where(eq(roles.name, 'Admin'))
  if (!adminRole) {
    console.error('Admin role not found — run the seed first.')
    return
  }

  for (const user of matchingUsers) {
    await db.insert(userRoles).values({ userId: user.id, roleId: adminRole.id }).onConflictDoNothing()
    console.log(`✅ Assigned Admin to ${user.name} (${user.email})`)
  }
}

assignAdmin()
  .catch((err) => { console.error('Failed:', err); process.exit(1) })
  .finally(() => pool.end())
