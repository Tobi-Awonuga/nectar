import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { departmentDefaultAssignees, users } from '../db/schema'

export interface DepartmentDefaultRecord {
  department: string
  userId: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    department: string | null
  } | null
}

export async function getAll(): Promise<DepartmentDefaultRecord[]> {
  const rows = await db
    .select({
      department: departmentDefaultAssignees.department,
      userId: departmentDefaultAssignees.userId,
      updatedAt: departmentDefaultAssignees.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        department: users.department,
      },
    })
    .from(departmentDefaultAssignees)
    .innerJoin(users, eq(users.id, departmentDefaultAssignees.userId))
    .where(isNull(users.deletedAt))
    .orderBy(asc(departmentDefaultAssignees.department))

  return rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getDefaultsForDepartments(departments: string[]): Promise<Map<string, string>> {
  const uniqueDepartments = [...new Set(departments.filter(Boolean))]
  if (uniqueDepartments.length === 0) return new Map()

  const rows = await db
    .select({
      department: departmentDefaultAssignees.department,
      userId: departmentDefaultAssignees.userId,
    })
    .from(departmentDefaultAssignees)
    .innerJoin(users, eq(users.id, departmentDefaultAssignees.userId))
    .where(and(inArray(departmentDefaultAssignees.department, uniqueDepartments), isNull(users.deletedAt), eq(users.isActive, true)))

  return new Map(rows.map((row) => [row.department, row.userId]))
}

export async function upsert(
  department: string,
  userId: string,
  updatedBy: string,
): Promise<DepartmentDefaultRecord> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      department: users.department,
      isActive: users.isActive,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || user.deletedAt || !user.isActive) {
    throw new Error('Default assignee user not found')
  }

  if (user.department !== department) {
    throw new Error('Default assignee must belong to the selected department')
  }

  const [record] = await db
    .insert(departmentDefaultAssignees)
    .values({
      department,
      userId,
      updatedBy,
    })
    .onConflictDoUpdate({
      target: departmentDefaultAssignees.department,
      set: {
        userId,
        updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning()

  return {
    department: record.department,
    userId: record.userId,
    updatedAt: record.updatedAt.toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
    },
  }
}
