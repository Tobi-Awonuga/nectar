import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { onboardingRequests, roles, userRoles, users } from '../db/schema'
import type { User } from '../db/schema'

export interface PendingOnboardingUser {
  user: User
  requestId: string
  requestedAt: string
}

export async function submitOnboarding(
  userId: string,
  data: { firstName: string; lastName: string; department: string },
): Promise<void> {
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

  await db
    .update(users)
    .set({
      name: fullName,
      department: data.department,
      onboardingStatus: 'pending_approval',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  // Create an onboarding request record
  await db
    .insert(onboardingRequests)
    .values({ userId, status: 'pending' })
    .onConflictDoNothing()
}

export async function getPendingUsers(): Promise<PendingOnboardingUser[]> {
  const rows = await db
    .select({
      user: users,
      requestId: onboardingRequests.id,
      requestedAt: onboardingRequests.createdAt,
    })
    .from(onboardingRequests)
    .innerJoin(users, eq(users.id, onboardingRequests.userId))
    .where(eq(onboardingRequests.status, 'pending'))
    .orderBy(desc(onboardingRequests.createdAt))

  return rows.map((r) => ({
    user: r.user,
    requestId: r.requestId,
    requestedAt: r.requestedAt.toISOString(),
  }))
}

export async function approveUser(userId: string, reviewerId: string): Promise<void> {
  // Update user to active + approved
  await db
    .update(users)
    .set({ isActive: true, onboardingStatus: 'approved', updatedAt: new Date() })
    .where(eq(users.id, userId))

  // Auto-assign Employee role
  const [employeeRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'Employee'))
    .limit(1)

  if (employeeRole) {
    await db
      .insert(userRoles)
      .values({ userId, roleId: employeeRole.id })
      .onConflictDoNothing()
  }

  // Mark the onboarding request as approved
  await db
    .update(onboardingRequests)
    .set({ status: 'approved', reviewedBy: reviewerId, reviewedAt: new Date() })
    .where(and(eq(onboardingRequests.userId, userId), eq(onboardingRequests.status, 'pending')))
}

export async function rejectUser(
  userId: string,
  reviewerId: string,
  notes?: string,
): Promise<void> {
  await db
    .update(users)
    .set({ onboardingStatus: 'rejected', updatedAt: new Date() })
    .where(eq(users.id, userId))

  await db
    .update(onboardingRequests)
    .set({
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      notes: notes ?? null,
    })
    .where(and(eq(onboardingRequests.userId, userId), eq(onboardingRequests.status, 'pending')))
}
