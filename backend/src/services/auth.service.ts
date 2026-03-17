import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
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
  user: Pick<User, 'id' | 'email' | 'name' | 'avatarUrl'>
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

// Step 2: Find or create the user record in the database
async function upsertUser(data: {
  azureOid: string
  email: string
  name: string
}): Promise<User> {
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
    return updated
  }

  const [created] = await db
    .insert(users)
    .values({ email: data.email, name: data.name, azureOid: data.azureOid })
    .returning()

  return created
}

// Step 3: Issue a Nectar JWT valid for 8 hours
function issueNectarToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: '8h' },
  )
}

export async function login(idToken: string): Promise<LoginResult> {
  const microsoftPayload = await validateMicrosoftToken(idToken)

  const email = microsoftPayload.email ?? microsoftPayload.preferred_username ?? ''
  if (!email) throw new Error('Could not extract email from Microsoft token')

  const user = await upsertUser({
    azureOid: microsoftPayload.oid,
    email,
    name: microsoftPayload.name,
  })

  const token = issueNectarToken(user)

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
  }
}

export async function getMe(userId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return result[0] ?? null
}
