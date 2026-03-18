import type { Workflow } from '@/types/domain.types'

export interface WorkflowBlueprintField {
  key: string
  label: string
  placeholder: string
  required?: boolean
  kind?: 'text' | 'textarea' | 'select' | 'date'
  options?: string[]
  wide?: boolean
}

export interface WorkflowCatalogItem {
  name: string
  slug: string
  category: string
  departments: string[]
  summary: string
  impact: string
  outcomes: string[]
  guidance: string[]
  fields: WorkflowBlueprintField[]
}

export const workflowDepartments = [
  'All Departments',
  'Production',
  'Shipping / Receiving',
  'Finished Goods',
  'Logistics',
  'Regulatory',
  'ERP / Systems',
  'Warehouse',
  'Inventory Control',
  'QA',
  'Finance',
  'Plant Leadership',
  'Analytics',
  'Human Resources',
] as const

const plantOptions = ['Burlington', 'Nashua', 'Medulla', 'Sunrise']
const shippingLabelIssueTypes = ['Wrong expiry', 'Wrong lot', 'Missing label', 'Wrong item label', 'Shipping document mismatch', 'Traceability concern']
const receivingIssueTypes = ['Damaged product', 'Missing lot data', 'Expiry issue', 'Wrong quantity', 'Wrong item']
const cycleCountReasonCodes = ['CC01 - Counting Error', 'CC02 - Damage', 'CC03 - Production Variance', 'CC04 - Receiving Error', 'CC05 - Unknown']
const supportAreas = ['Item Master', 'Receiving', 'Inventory', 'Transfer Orders', 'Shipping Documents', 'Label Printing', 'Masterplan Access', 'Reporting / Export']
const employeeChangeTypes = ['Department change', 'Supervisor change', 'Name update', 'Status update', 'Other']

export const workflowCatalog: WorkflowCatalogItem[] = [
  {
    name: 'Shipping / Label Incident',
    slug: 'shipping-label-incident',
    category: 'Operations Control',
    departments: ['Production', 'Shipping / Receiving', 'Finished Goods', 'Logistics', 'Regulatory', 'ERP / Systems'],
    summary: 'Report label, shipping, and traceability issues before they become dispatch or compliance risks.',
    impact: 'Creates one controlled path for relabels, ERP corrections, and shipment-impacting decisions.',
    outcomes: [
      'The issue reaches the right owner quickly',
      'Traceability-sensitive fixes are documented from report to close',
    ],
    guidance: [
      'Keep the report factual and short. Focus on the item, lot, and what is wrong.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'issueType', label: 'Issue Type', placeholder: 'Select the issue type', required: true, kind: 'select', options: shippingLabelIssueTypes },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the affected lot number', required: true },
      { key: 'incidentSummary', label: 'What Happened?', placeholder: 'Describe the issue clearly in one or two sentences.', required: true, kind: 'textarea', wide: true },
    ],
  },
  {
    name: 'Receiving Exception',
    slug: 'receiving-exception',
    category: 'Warehouse Control',
    departments: ['Shipping / Receiving', 'Warehouse', 'Inventory Control', 'QA', 'ERP / Systems'],
    summary: 'Capture inbound issues involving ingredients, packaging, lot data, expiry dates, or receiving accuracy.',
    impact: 'Prevents receiving problems from disappearing into informal fixes.',
    outcomes: [
      'Inbound issues get ownership and follow-through',
      'Lot and expiry problems are documented early',
    ],
    guidance: [
      'Capture only the shipment facts needed to route the issue and protect traceability.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant received the shipment?', required: true, kind: 'select', options: plantOptions },
      { key: 'supplier', label: 'Supplier', placeholder: 'Supplier name', required: true },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the lot number', required: true },
      { key: 'issueType', label: 'Issue Type', placeholder: 'Select the issue type', required: true, kind: 'select', options: receivingIssueTypes },
    ],
  },
  {
    name: 'Cycle Count Discrepancy',
    slug: 'cycle-count-discrepancy',
    category: 'Inventory Control',
    departments: ['Inventory Control', 'Warehouse', 'Production', 'ERP / Systems'],
    summary: 'Investigate count variances with reason codes, ownership, and follow-through.',
    impact: 'Turns recurring inventory discrepancies into trackable operational work instead of isolated corrections.',
    outcomes: [
      'Variance gets reviewed with context',
      'Reason-code trends can be reused for process improvement',
    ],
    guidance: [
      'Focus on the variance, where it was found, and the likely cause if known.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the lot number', required: true },
      { key: 'binLocation', label: 'Bin / Location', placeholder: 'MF.FLOOR, NF.FLOOR, etc.', required: true },
      { key: 'reasonCode', label: 'Reason Code', placeholder: 'Select the reason code', required: true, kind: 'select', options: cycleCountReasonCodes },
    ],
  },
  {
    name: 'Inventory Adjustment Review',
    slug: 'inventory-adjustment-review',
    category: 'Inventory Control',
    departments: ['Inventory Control', 'Warehouse', 'Finance', 'ERP / Systems'],
    summary: 'Review stock corrections, anomalies, and traceability-sensitive adjustments.',
    impact: 'Creates a visible path for inventory corrections instead of one-off changes.',
    outcomes: [
      'Adjustments are reviewed with context',
      'Inventory correction logic becomes reusable',
    ],
    guidance: [
      'Capture what someone needs to validate the adjustment, not the full investigation.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the lot number', required: true },
      { key: 'adjustmentReason', label: 'Adjustment Reason', placeholder: 'Why is the stock being adjusted?', required: true, kind: 'textarea', wide: true },
    ],
  },
  {
    name: 'Transfer Order Issue',
    slug: 'transfer-order-issue',
    category: 'Warehouse Movement',
    departments: ['Warehouse', 'Inventory Control', 'Shipping / Receiving', 'ERP / Systems'],
    summary: 'Handle transfer mismatches, location errors, and internal movement exceptions.',
    impact: 'Gives transfer issues an owner instead of relying on verbal follow-up.',
    outcomes: [
      'Transfer issues stay visible until corrected',
      'Location and movement problems are easier to trace',
    ],
    guidance: [
      'Capture the transfer reference and the location mismatch clearly.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'transferOrder', label: 'Transfer Order', placeholder: 'Enter the transfer order reference', required: true },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the lot number', required: true },
      { key: 'locationIssue', label: 'Location Issue', placeholder: 'What is wrong with the movement or location?', required: true, kind: 'textarea', wide: true },
    ],
  },
  {
    name: 'Production Consumption Variance',
    slug: 'production-consumption-variance',
    category: 'Production Control',
    departments: ['Production', 'Inventory Control', 'ERP / Systems', 'Plant Leadership'],
    summary: 'Capture production-to-ERP consumption mismatches and route them to the right owners.',
    impact: 'Reduces silent production variances and makes follow-up measurable.',
    outcomes: [
      'Consumption variances get reviewed consistently',
      'Inventory and production teams work from the same record',
    ],
    guidance: [
      'Focus on the variance, the affected material, and the production context.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the consumed item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the lot number', required: true },
      { key: 'productionLine', label: 'Production Line', placeholder: 'Which line or area was involved?', required: true },
      { key: 'varianceSummary', label: 'Variance Summary', placeholder: 'What mismatch was found between production and ERP?', required: true, kind: 'textarea', wide: true },
    ],
  },
  {
    name: 'ERP / System Support Request',
    slug: 'erp-system-support-request',
    category: 'Systems Support',
    departments: ['ERP / Systems', 'Production', 'Warehouse', 'Shipping / Receiving', 'Inventory Control', 'Analytics', 'Human Resources'],
    summary: 'Route Masterplan support issues, access needs, label system problems, and operational blockers.',
    impact: 'Gives teams one clear path for operational systems support.',
    outcomes: [
      'System blockers get owned faster',
      'Support work is easier to prioritize and reuse in SOPs',
    ],
    guidance: [
      'Describe the issue in operational terms and name the impacted process.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'systemArea', label: 'System Area', placeholder: 'Select the affected area', required: true, kind: 'select', options: supportAreas },
      { key: 'processImpacted', label: 'Process Impacted', placeholder: 'What work is blocked or slowed down?', required: true },
      { key: 'issueSummary', label: 'Issue Summary', placeholder: 'Describe the system issue clearly.', required: true, kind: 'textarea', wide: true },
    ],
  },
  {
    name: 'Quality / Traceability Hold',
    slug: 'quality-traceability-hold',
    category: 'Compliance',
    departments: ['QA', 'Regulatory', 'Production', 'Inventory Control', 'Shipping / Receiving'],
    summary: 'Document lot, expiry, and traceability concerns that require controlled review before release.',
    impact: 'Protects traceability and ensures hold decisions are visible and auditable.',
    outcomes: [
      'Traceability concerns get controlled quickly',
      'Release decisions are documented clearly',
    ],
    guidance: [
      'Capture only the facts needed to protect traceability and start the hold review.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant is affected?', required: true, kind: 'select', options: plantOptions },
      { key: 'itemSku', label: 'Item / SKU', placeholder: 'Enter the item number or SKU', required: true },
      { key: 'lotNumber', label: 'Lot Number', placeholder: 'Enter the lot number', required: true },
      { key: 'holdReason', label: 'Hold Reason', placeholder: 'What traceability or quality concern triggered the hold?', required: true, kind: 'textarea', wide: true },
    ],
  },
  {
    name: 'Employee Onboarding Request',
    slug: 'employee-onboarding-request',
    category: 'Human Resources',
    departments: ['Human Resources', 'Plant Leadership', 'ERP / Systems'],
    summary: 'Coordinate onboarding setup for new hires across HR, plant leadership, and systems support.',
    impact: 'Prevents onboarding work from being split across email, chat, and memory.',
    outcomes: [
      'New-hire setup has clear ownership',
      'HR and operational teams work from the same request',
    ],
    guidance: [
      'Only capture what the teams need to start onboarding cleanly.',
    ],
    fields: [
      { key: 'plant', label: 'Plant', placeholder: 'Which plant or office is the employee joining?', required: true, kind: 'select', options: plantOptions },
      { key: 'employeeName', label: 'Employee Name', placeholder: 'Enter the employee name', required: true },
      { key: 'startDate', label: 'Start Date', placeholder: 'When does the employee start?', required: true, kind: 'date' },
      { key: 'roleArea', label: 'Role / Department', placeholder: 'What function are they joining?', required: true },
    ],
  },
  {
    name: 'Employee Record Change',
    slug: 'employee-record-change',
    category: 'Human Resources',
    departments: ['Human Resources', 'ERP / Systems', 'Plant Leadership'],
    summary: 'Track updates to employee records, department changes, or operational profile corrections.',
    impact: 'Keeps sensitive employee record updates visible and controlled.',
    outcomes: [
      'Record changes are documented and approved clearly',
      'HR and systems teams avoid silent mismatches',
    ],
    guidance: [
      'Describe the employee change clearly and keep the request factual.',
    ],
    fields: [
      { key: 'employeeName', label: 'Employee Name', placeholder: 'Enter the employee name', required: true },
      { key: 'changeType', label: 'Change Type', placeholder: 'Select the change type', required: true, kind: 'select', options: employeeChangeTypes },
      { key: 'effectiveDate', label: 'Effective Date', placeholder: 'When should the change take effect?', required: true, kind: 'date' },
      { key: 'changeSummary', label: 'Change Summary', placeholder: 'What needs to be updated?', required: true, kind: 'textarea', wide: true },
    ],
  },
]

function resolveWorkflowName(workflow?: Pick<Workflow, 'name'> | string | null) {
  if (!workflow) return undefined
  return typeof workflow === 'string' ? workflow : workflow.name
}

export function getWorkflowBlueprint(workflow?: Pick<Workflow, 'name'> | string | null) {
  const workflowName = resolveWorkflowName(workflow)
  return workflowCatalog.find((item) => item.name === workflowName) ?? {
    name: 'Workflow',
    slug: 'general-workflow',
    category: 'Operations',
    departments: ['All Departments'],
    summary: 'Select a workflow to start a structured operational request.',
    impact: 'Nectar keeps operational work clear, traceable, and reusable across teams and plants.',
    outcomes: [
      'The request is captured consistently',
      'The right team can review it faster',
    ],
    guidance: ['Pick the workflow that best matches the operational issue.'],
    fields: [],
  }
}

export function matchesDepartment(workflow: Pick<Workflow, 'name'> | string, department?: string) {
  if (!department || department === 'All Departments') return true
  return getWorkflowBlueprint(workflow).departments.includes(department)
}
