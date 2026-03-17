import { and, eq, isNull } from 'drizzle-orm'
import { db } from './index'
import {
  roles,
  transitionAllowedRoles,
  users,
  workflows,
  workflowStates,
  workflowTransitions,
} from './schema'

interface WorkflowStateDefinition {
  name: string
  label: string
  isInitial: boolean
  isFinal: boolean
  color: string
  position: number
}

interface WorkflowTransitionDefinition {
  actionName: string
  actionLabel: string
  fromState: string
  toState: string
  allowedRoleNames: string[]
}

interface WorkflowDefinition {
  name: string
  description: string
  states: WorkflowStateDefinition[]
  transitions: WorkflowTransitionDefinition[]
}

const reviewStates: WorkflowStateDefinition[] = [
  { name: 'reported', label: 'Reported', isInitial: true, isFinal: false, color: 'blue', position: 0 },
  { name: 'under_review', label: 'Under Review', isInitial: false, isFinal: false, color: 'yellow', position: 1 },
  { name: 'action_required', label: 'Action Required', isInitial: false, isFinal: false, color: 'blue', position: 2 },
  { name: 'resolved', label: 'Resolved', isInitial: false, isFinal: true, color: 'green', position: 3 },
  { name: 'closed', label: 'Closed', isInitial: false, isFinal: true, color: 'slate', position: 4 },
]

const reviewTransitions: WorkflowTransitionDefinition[] = [
  {
    actionName: 'review',
    actionLabel: 'Start Review',
    fromState: 'reported',
    toState: 'under_review',
    allowedRoleNames: ['Admin', 'Manager', 'Employee'],
  },
  {
    actionName: 'request_action',
    actionLabel: 'Request Action',
    fromState: 'under_review',
    toState: 'action_required',
    allowedRoleNames: ['Admin', 'Manager'],
  },
  {
    actionName: 'resolve',
    actionLabel: 'Resolve',
    fromState: 'action_required',
    toState: 'resolved',
    allowedRoleNames: ['Admin', 'Manager', 'Employee'],
  },
  {
    actionName: 'close',
    actionLabel: 'Close',
    fromState: 'resolved',
    toState: 'closed',
    allowedRoleNames: ['Admin', 'Manager'],
  },
]

const systemWorkflowCatalog: WorkflowDefinition[] = [
  {
    name: 'Shipping / Label Incident',
    description: 'Capture labeling, shipping, and traceability issues before they become dispatch or compliance risks.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Receiving Exception',
    description: 'Track inbound issues involving ingredients, packaging, lot data, expiry dates, or receiving accuracy.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Cycle Count Discrepancy',
    description: 'Investigate count variances with reason codes, ownership, and follow-through.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Inventory Adjustment Review',
    description: 'Standardize review of inventory corrections, stock anomalies, and traceability-sensitive adjustments.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Transfer Order Issue',
    description: 'Handle transfer mismatches, location errors, and internal movement exceptions.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Production Consumption Variance',
    description: 'Capture production-to-ERP consumption mismatches and route them to the right operational owners.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'ERP / System Support Request',
    description: 'Route Masterplan support issues, access needs, label system problems, and operational system blockers.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Quality / Traceability Hold',
    description: 'Document lot, expiry, and traceability concerns that require controlled review before release.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Employee Onboarding Request',
    description: 'Coordinate onboarding setup for new hires across HR, plant leadership, and systems support.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
  {
    name: 'Employee Record Change',
    description: 'Track employee record updates, department changes, and profile corrections in a controlled flow.',
    states: reviewStates,
    transitions: reviewTransitions,
  },
]

async function ensureSystemUser() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'system@nectar.local'))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(users)
    .values({
      email: 'system@nectar.local',
      name: 'System',
    })
    .returning()

  return created
}

export async function ensureSystemWorkflowCatalog(): Promise<void> {
  const systemUser = await ensureSystemUser()
  const roleRows = await db.select().from(roles)
  const roleByName = new Map(roleRows.map((role) => [role.name, role.id]))

  for (const definition of systemWorkflowCatalog) {
    let [workflow] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.name, definition.name), isNull(workflows.deletedAt)))
      .limit(1)

    if (!workflow) {
      ;[workflow] = await db
        .insert(workflows)
        .values({
          name: definition.name,
          description: definition.description,
          createdBy: systemUser.id,
          isActive: true,
        })
        .returning()
    }

    let states = await db
      .select()
      .from(workflowStates)
      .where(eq(workflowStates.workflowId, workflow.id))

    if (states.length === 0) {
      states = await db
        .insert(workflowStates)
        .values(definition.states.map((state) => ({ ...state, workflowId: workflow.id })))
        .returning()
    }

    const stateByName = new Map(states.map((state) => [state.name, state.id]))

    const transitions = await db
      .select()
      .from(workflowTransitions)
      .where(eq(workflowTransitions.workflowId, workflow.id))

    if (transitions.length === 0) {
      for (const transition of definition.transitions) {
        const [createdTransition] = await db
          .insert(workflowTransitions)
          .values({
            workflowId: workflow.id,
            fromStateId: stateByName.get(transition.fromState)!,
            toStateId: stateByName.get(transition.toState)!,
            actionName: transition.actionName,
            actionLabel: transition.actionLabel,
          })
          .returning()

        for (const roleName of transition.allowedRoleNames) {
          const roleId = roleByName.get(roleName)
          if (!roleId) continue

          await db
            .insert(transitionAllowedRoles)
            .values({
              transitionId: createdTransition.id,
              roleId,
            })
            .onConflictDoNothing()
        }
      }
    }
  }
}
