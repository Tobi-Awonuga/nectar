import { eq } from 'drizzle-orm'
import { db, pool } from './index'
import {
  users,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  workflows,
  workflowStates,
  workflowTransitions,
  transitionAllowedRoles,
} from './schema'

async function seed() {
  console.log('🌱 Seeding Nectar database...\n')

  await db.transaction(async (tx) => {
    // ------------------------------------------------------------------ //
    //  1. System user (needed as createdBy for seed workflows)
    // ------------------------------------------------------------------ //
    console.log('Creating system user...')
    const [systemUser] = await tx
      .insert(users)
      .values({
        email: 'system@nectar.local',
        name: 'System',
      })
      .onConflictDoNothing({ target: users.email })
      .returning()

    // If the user already existed we need to fetch it
    const sysUser =
      systemUser ??
      (
        await tx
          .select()
          .from(users)
          .where(eq(users.email, 'system@nectar.local'))
      )[0]

    console.log(`  System user id: ${sysUser.id}`)

    // ------------------------------------------------------------------ //
    //  2. Roles
    // ------------------------------------------------------------------ //
    console.log('Creating roles...')
    const roleData = [
      { name: 'Admin', description: 'Full platform access' },
      { name: 'Manager', description: 'Can approve, manage workflows' },
      {
        name: 'Employee',
        description: 'Can create instances, view own tasks',
      },
    ] as const

    for (const r of roleData) {
      await tx
        .insert(roles)
        .values({ name: r.name, description: r.description })
        .onConflictDoNothing({ target: roles.name })
    }

    const [adminRole] = await tx
      .select()
      .from(roles)
      .where(eq(roles.name, 'Admin'))
    const [managerRole] = await tx
      .select()
      .from(roles)
      .where(eq(roles.name, 'Manager'))
    const [employeeRole] = await tx
      .select()
      .from(roles)
      .where(eq(roles.name, 'Employee'))

    console.log(
      `  Roles: Admin(${adminRole.id}), Manager(${managerRole.id}), Employee(${employeeRole.id})`,
    )

    // ------------------------------------------------------------------ //
    //  3. Permissions
    // ------------------------------------------------------------------ //
    console.log('Creating permissions...')
    const permData = [
      { name: 'workflow:create', description: 'Create workflows' },
      { name: 'workflow:read', description: 'View workflows' },
      { name: 'workflow:update', description: 'Edit workflows' },
      { name: 'workflow:delete', description: 'Delete workflows' },
      { name: 'task:read', description: 'View tasks' },
      { name: 'task:update', description: 'Update tasks' },
      { name: 'task:assign', description: 'Assign tasks' },
      { name: 'approval:approve', description: 'Approve requests' },
      { name: 'approval:reject', description: 'Reject requests' },
      { name: 'audit:read', description: 'View audit logs' },
      { name: 'admin:users', description: 'Manage users' },
      { name: 'admin:roles', description: 'Manage roles' },
    ]

    for (const p of permData) {
      await tx
        .insert(permissions)
        .values({ name: p.name, description: p.description })
        .onConflictDoNothing({ target: permissions.name })
    }

    // Fetch all permissions back so we have their IDs
    const allPerms = await tx.select().from(permissions)
    const permByName = Object.fromEntries(allPerms.map((p) => [p.name, p]))

    console.log(`  ${allPerms.length} permissions created/verified`)

    // ------------------------------------------------------------------ //
    //  4. Role ↔ Permission mappings
    // ------------------------------------------------------------------ //
    console.log('Mapping role permissions...')

    const adminPerms = allPerms.map((p) => p.name)
    const managerPerms = [
      'workflow:create',
      'workflow:read',
      'workflow:update',
      'task:read',
      'task:update',
      'task:assign',
      'approval:approve',
      'approval:reject',
      'audit:read',
    ]
    const employeePerms = ['workflow:read', 'task:read', 'task:update']

    const mappings: { roleId: string; permNames: string[] }[] = [
      { roleId: adminRole.id, permNames: adminPerms },
      { roleId: managerRole.id, permNames: managerPerms },
      { roleId: employeeRole.id, permNames: employeePerms },
    ]

    for (const { roleId, permNames } of mappings) {
      for (const permName of permNames) {
        const perm = permByName[permName]
        if (!perm) continue
        await tx
          .insert(rolePermissions)
          .values({ roleId, permissionId: perm.id })
          .onConflictDoNothing()
      }
    }
    console.log('  Role-permission mappings applied')

    // ------------------------------------------------------------------ //
    //  5. Assign Admin role to system user
    // ------------------------------------------------------------------ //
    console.log('Assigning Admin role to system user...')
    await tx
      .insert(userRoles)
      .values({ userId: sysUser.id, roleId: adminRole.id })
      .onConflictDoNothing()

    // ------------------------------------------------------------------ //
    //  Helper role-ID arrays for transition allowed-role mappings
    // ------------------------------------------------------------------ //
    const allRoleIds = [adminRole.id, managerRole.id, employeeRole.id]
    const mgrAdminIds = [adminRole.id, managerRole.id]

    // ================================================================== //
    //  6. Workflow — Purchase Request
    // ================================================================== //
    console.log('Creating workflow: Purchase Request...')

    const [purchaseWf] = await tx
      .insert(workflows)
      .values({
        name: 'Purchase Request',
        description:
          'Standard purchase request approval workflow for procurement items.',
        createdBy: sysUser.id,
      })
      .returning()

    // States
    const purchaseStatesData = [
      {
        name: 'draft',
        label: 'Draft',
        isInitial: true,
        isFinal: false,
        color: 'slate',
        position: 0,
      },
      {
        name: 'submitted',
        label: 'Submitted',
        isInitial: false,
        isFinal: false,
        color: 'blue',
        position: 1,
      },
      {
        name: 'under_review',
        label: 'Under Review',
        isInitial: false,
        isFinal: false,
        color: 'yellow',
        position: 2,
      },
      {
        name: 'approved',
        label: 'Approved',
        isInitial: false,
        isFinal: true,
        color: 'green',
        position: 3,
      },
      {
        name: 'rejected',
        label: 'Rejected',
        isInitial: false,
        isFinal: true,
        color: 'red',
        position: 4,
      },
    ]

    const purchaseStates = await tx
      .insert(workflowStates)
      .values(
        purchaseStatesData.map((s) => ({ ...s, workflowId: purchaseWf.id })),
      )
      .returning()

    const psMap = Object.fromEntries(purchaseStates.map((s) => [s.name, s]))

    // Transitions
    const purchaseTransitionsData = [
      {
        actionName: 'submit',
        actionLabel: 'Submit',
        fromState: 'draft',
        toState: 'submitted',
        allowedRoleIds: allRoleIds,
      },
      {
        actionName: 'review',
        actionLabel: 'Review',
        fromState: 'submitted',
        toState: 'under_review',
        allowedRoleIds: mgrAdminIds,
      },
      {
        actionName: 'approve',
        actionLabel: 'Approve',
        fromState: 'under_review',
        toState: 'approved',
        allowedRoleIds: mgrAdminIds,
      },
      {
        actionName: 'reject',
        actionLabel: 'Reject',
        fromState: 'under_review',
        toState: 'rejected',
        allowedRoleIds: mgrAdminIds,
      },
      {
        actionName: 'revise',
        actionLabel: 'Revise',
        fromState: 'rejected',
        toState: 'draft',
        allowedRoleIds: allRoleIds,
      },
    ]

    for (const t of purchaseTransitionsData) {
      const [transition] = await tx
        .insert(workflowTransitions)
        .values({
          workflowId: purchaseWf.id,
          fromStateId: psMap[t.fromState].id,
          toStateId: psMap[t.toState].id,
          actionName: t.actionName,
          actionLabel: t.actionLabel,
        })
        .returning()

      for (const roleId of t.allowedRoleIds) {
        await tx
          .insert(transitionAllowedRoles)
          .values({ transitionId: transition.id, roleId })
          .onConflictDoNothing()
      }
    }

    console.log(
      `  Purchase Request workflow created (${purchaseStates.length} states, ${purchaseTransitionsData.length} transitions)`,
    )

    // ================================================================== //
    //  7. Workflow — IT Access Request
    // ================================================================== //
    console.log('Creating workflow: IT Access Request...')

    const [itWf] = await tx
      .insert(workflows)
      .values({
        name: 'IT Access Request',
        description:
          'Request and provision IT system access for employees and contractors.',
        createdBy: sysUser.id,
      })
      .returning()

    // States
    const itStatesData = [
      {
        name: 'draft',
        label: 'Draft',
        isInitial: true,
        isFinal: false,
        color: 'slate',
        position: 0,
      },
      {
        name: 'pending_approval',
        label: 'Pending Approval',
        isInitial: false,
        isFinal: false,
        color: 'yellow',
        position: 1,
      },
      {
        name: 'approved',
        label: 'Approved',
        isInitial: false,
        isFinal: false,
        color: 'green',
        position: 2,
      },
      {
        name: 'provisioning',
        label: 'Provisioning',
        isInitial: false,
        isFinal: false,
        color: 'blue',
        position: 3,
      },
      {
        name: 'completed',
        label: 'Completed',
        isInitial: false,
        isFinal: true,
        color: 'green',
        position: 4,
      },
      {
        name: 'rejected',
        label: 'Rejected',
        isInitial: false,
        isFinal: true,
        color: 'red',
        position: 5,
      },
    ]

    const itStates = await tx
      .insert(workflowStates)
      .values(itStatesData.map((s) => ({ ...s, workflowId: itWf.id })))
      .returning()

    const itMap = Object.fromEntries(itStates.map((s) => [s.name, s]))

    // Transitions
    const adminOnlyIds = [adminRole.id]
    const itTransitionsData = [
      {
        actionName: 'submit',
        actionLabel: 'Submit',
        fromState: 'draft',
        toState: 'pending_approval',
        allowedRoleIds: allRoleIds,
      },
      {
        actionName: 'approve',
        actionLabel: 'Approve',
        fromState: 'pending_approval',
        toState: 'approved',
        allowedRoleIds: mgrAdminIds,
      },
      {
        actionName: 'reject',
        actionLabel: 'Reject',
        fromState: 'pending_approval',
        toState: 'rejected',
        allowedRoleIds: mgrAdminIds,
      },
      {
        actionName: 'provision',
        actionLabel: 'Provision',
        fromState: 'approved',
        toState: 'provisioning',
        allowedRoleIds: adminOnlyIds,
      },
      {
        actionName: 'complete',
        actionLabel: 'Complete',
        fromState: 'provisioning',
        toState: 'completed',
        allowedRoleIds: adminOnlyIds,
      },
      {
        actionName: 'revise',
        actionLabel: 'Revise',
        fromState: 'rejected',
        toState: 'draft',
        allowedRoleIds: allRoleIds,
      },
    ]

    for (const t of itTransitionsData) {
      const [transition] = await tx
        .insert(workflowTransitions)
        .values({
          workflowId: itWf.id,
          fromStateId: itMap[t.fromState].id,
          toStateId: itMap[t.toState].id,
          actionName: t.actionName,
          actionLabel: t.actionLabel,
        })
        .returning()

      for (const roleId of t.allowedRoleIds) {
        await tx
          .insert(transitionAllowedRoles)
          .values({ transitionId: transition.id, roleId })
          .onConflictDoNothing()
      }
    }

    console.log(
      `  IT Access Request workflow created (${itStates.length} states, ${itTransitionsData.length} transitions)`,
    )
  })

  console.log('\n✅ Seed complete!')
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
