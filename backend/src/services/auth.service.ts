import jwt from 'jsonwebtoken'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { users, roles, userRoles } from '../db/schema'
import { env } from '../config/env'
import { jwksClient, microsoftJwtOptions } from '../config/auth'
import type { User } from '../db/schema'

interface MicrosoftTokenPayload {
  oid: string
  preferred_username?: string
  email?: string
  name: string
}

export interface LoginResult {
  token: string
  user: Pick<User, 'id' | 'email' | 'name' | 'avatarUrl' | 'isActive'> & {
    roles: string[]
    onboardingStatus: string
    department: string | null
  }
}

// Step 1: Validate the Microsoft ID token against Microsoft's public JWKS
async function validateMicrosoftToken(idToken: string): Promise<MicrosoftTokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      (header, callback) => {
        jwksClient.getSigningKey(header.kid!, (err, key) => {
          if (err) return callback(err)
          callback(null, key!.getPublicKey())
        })
      },
      microsoftJwtOptions,
      (err, decoded) => {
        if (err) return reject(new Error('Invalid Microsoft token'))
        resolve(decoded as MicrosoftTokenPayload)
      },
    )
  })
}

// Step 2: Find or create the user record in the database.
// For new users, auto-assigns the "Employee" role on first login.
async function upsertUser(data: {
  azureOid: string
  email: string
  name: string
}): Promise<{ user: User; isNew: boolean }> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.azureOid, data.azureOid))
    .limit(1)

  if (existing.length > 0) {
    const [updated] = await db
      .update(users)
      .set({ email: data.email, name: data.name, updatedAt: new Date() })
      .where(eq(users.id, existing[0].id))
      .returning()

    // If the user somehow has no roles assigned, auto-assign Employee so they can access the app
    try {
      const existingRoles = await db.select().from(userRoles).where(eq(userRoles.userId, updated.id))
      if (existingRoles.length === 0) {
        const [employeeRole] = await db
          .select({ id: roles.id })
          .from(roles)
          .where(eq(roles.name, 'Employee'))
          .limit(1)
        if (employeeRole) {
          await db.insert(userRoles).values({ userId: updated.id, roleId: employeeRole.id }).onConflictDoNothing()
        }
      }
    } catch {
      // Non-fatal: role assignment failure must not block login
    }

    return { user: updated, isNew: false }
  }

  const [created] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      azureOid: data.azureOid,
      isActive: false,
      onboardingStatus: 'pending_onboarding',
    })
    .returning()

  // New users require admin approval before accessing the app — do NOT assign roles here.

  return { user: created, isNew: true }
}

// Step 3: Query the roles assigned to a user
async function getUserRoleNames(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))

  return rows.map((r) => r.name)
}

// Step 4: Issue a Nectar JWT valid for 8 hours, including the user's roles
function issueNectarToken(user: User, roleNames: string[]): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, roles: roleNames },
    env.JWT_SECRET,
    { expiresIn: '8h' },
  )
}

export async function login(idToken: string): Promise<LoginResult> {
  const microsoftPayload = await validateMicrosoftToken(idToken)

  const email = microsoftPayload.email ?? microsoftPayload.preferred_username ?? ''
  if (!email) throw new Error('Could not extract email from Microsoft token')

  const { user } = await upsertUser({
    azureOid: microsoftPayload.oid,
    email,
    name: microsoftPayload.name,
  })

  const roleNames = await getUserRoleNames(user.id)
  const token = issueNectarToken(user, roleNames)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      onboardingStatus: user.onboardingStatus,
      department: user.department ?? null,
      roles: roleNames,
    },
  }
}

export async function getMe(userId: string): Promise<(User & { roles: string[] }) | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = result[0]
  if (!user) return null

  const roleNames = await getUserRoleNames(userId)
  return { ...user, roles: roleNames }
}
