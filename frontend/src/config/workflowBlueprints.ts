import type { Workflow } from '@/types/domain.types'

export interface WorkflowBlueprintField {
  key: string
  label: string
  placeholder: string
  required?: boolean
  kind?: 'text' | 'textarea'
}

export interface WorkflowBlueprint {
  slug: string
  category: string
  summary: string
  impact: string
  forWhom: string[]
  outcomes: string[]
  useCases: string[]
  guidance: string[]
  fields: WorkflowBlueprintField[]
}

const fallbackBlueprint: WorkflowBlueprint = {
  slug: 'general-workflow',
  category: 'Operations',
  summary: 'Use this workflow to submit a structured request that needs visibility and approvals.',
  impact: 'Standardizes intake, ownership, and traceability for recurring internal work.',
  forWhom: ['Requestors', 'Managers', 'Operations'],
  outcomes: [
    'Request is recorded in a consistent format',
    'Approvers see the right context before acting',
    'Audit history is preserved from submission onward',
  ],
  useCases: [
    'Any recurring internal process that should not live in email or chat',
  ],
  guidance: [
    'Write a title that explains the business need, not just the object being requested.',
    'Include enough context that the approver can act without chasing for clarifications.',
  ],
  fields: [
    {
      key: 'businessJustification',
      label: 'Business Justification',
      placeholder: 'Why does this request matter right now?',
      required: true,
      kind: 'textarea',
    },
  ],
}

const blueprintsByName: Record<string, WorkflowBlueprint> = {
  'Purchase Request': {
    slug: 'purchase-request',
    category: 'Procurement',
    summary: 'Structured intake for buying goods or services that need business and managerial review.',
    impact: 'Prevents ad hoc spending and creates a clear approval trail from request to decision.',
    forWhom: ['Employees', 'Managers', 'Finance / Procurement'],
    outcomes: [
      'The request is justified before money is committed',
      'Approvers can review urgency, cost, and business need in one place',
      'Rejected requests come back with a clear revision path',
    ],
    useCases: [
      'Requesting packaging materials, ingredients, or line-side consumables',
      'Buying maintenance parts, tools, or office equipment',
      'Purchasing software subscriptions or vendor services',
    ],
    guidance: [
      'State what is being requested and who it is for.',
      'Call out the operational or financial reason for the purchase.',
      'If timing matters, explain the deadline and impact of delay.',
    ],
    fields: [
      {
        key: 'requestedFor',
        label: 'Requested For',
        placeholder: 'Who needs this purchase?',
        required: true,
      },
      {
        key: 'department',
        label: 'Department',
        placeholder: 'Which team or function will use it?',
        required: true,
      },
      {
        key: 'businessJustification',
        label: 'Business Justification',
        placeholder: 'Why is this purchase needed?',
        required: true,
        kind: 'textarea',
      },
      {
        key: 'targetDate',
        label: 'Needed By',
        placeholder: 'When is it needed?',
      },
    ],
  },
  'IT Access Request': {
    slug: 'it-access-request',
    category: 'Access Control',
    summary: 'Controlled request path for granting access to systems, tools, or restricted internal resources.',
    impact: 'Reduces informal access grants and gives IT and managers a visible, auditable approval chain.',
    forWhom: ['Employees', 'Managers', 'IT Admins'],
    outcomes: [
      'The right system and access scope are reviewed before provisioning',
      'Approval and provisioning responsibilities are clearly separated',
      'Completion is visible to both the requestor and administrators',
    ],
    useCases: [
      'New starter access to ERP, production, QA, or warehouse systems',
      'Temporary elevated access for a project or incident',
      'Access to dashboards, shared drives, or operational tools',
    ],
    guidance: [
      'Be explicit about which system or resource is needed.',
      'Describe the role or task that requires access.',
      'If the request is temporary, include the expected end date.',
    ],
    fields: [
      {
        key: 'requestedFor',
        label: 'Requested For',
        placeholder: 'Who needs access?',
        required: true,
      },
      {
        key: 'systemName',
        label: 'System / Resource',
        placeholder: 'Which application, folder, or platform is needed?',
        required: true,
      },
      {
        key: 'accessLevel',
        label: 'Access Level',
        placeholder: 'Read only, contributor, admin, etc.',
        required: true,
      },
      {
        key: 'businessJustification',
        label: 'Business Justification',
        placeholder: 'What work requires this access?',
        required: true,
        kind: 'textarea',
      },
    ],
  },
}

export function getWorkflowBlueprint(workflow?: Pick<Workflow, 'name'> | null): WorkflowBlueprint {
  if (!workflow?.name) return fallbackBlueprint
  return blueprintsByName[workflow.name] ?? fallbackBlueprint
}
