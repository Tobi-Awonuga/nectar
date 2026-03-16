import { db } from '../db'
import { users } from '../db/schema'
import type { User } from '../db/schema'

export interface LoginCredentials {
  email?: string
  token?: string
}

export interface AuthResult {
  user: Pick<User, 'id' | 'email' | 'name'>
  accessToken: string
}

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  // TODO: validate credentials or exchange Azure SSO token
  // TODO: find or create user record in DB
  // TODO: sign and return JWT containing user id, email, name
  void db
  void users
  void credentials
  throw new Error('Not implemented')
}

export async function logout(userId: string): Promise<void> {
  // TODO: invalidate token / session (e.g. add to a denylist or clear refresh token)
  void userId
}

export async function getMe(userId: string): Promise<User | null> {
  // TODO: return db.select().from(users).where(eq(users.id, userId)).limit(1)
  void userId
  return null
}
