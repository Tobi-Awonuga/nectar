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

export async function getPendingUsers(reviewerId: string): Promise<PendingOnboardingUser[]> {
  // Admins see all pending requests; managers see only requests for their department
  const [adminRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'Admin')).limit(1)

  let isAdmin = false
  if (adminRole) {
    const [assignment] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, reviewerId), eq(userRoles.roleId, adminRole.id)))
      .limit(1)
    isAdmin = !!assignment
  }

  let deptFilter: string | null = null
  if (!isAdmin) {
    const [reviewer] = await db
      .select({ department: users.department })
      .from(users)
      .where(eq(users.id, reviewerId))
      .limit(1)
    deptFilter = reviewer?.department ?? null
  }

  const whereClause = deptFilter
    ? and(eq(onboardingRequests.status, 'pending'), eq(users.department, deptFilter))
    : eq(onboardingRequests.status, 'pending')

  const rows = await db
    .select({
      user: users,
      requestId: onboardingRequests.id,
      requestedAt: onboardingRequests.createdAt,
    })
    .from(onboardingRequests)
    .innerJoin(users, eq(users.id, onboardingRequests.userId))
    .where(whereClause)
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
