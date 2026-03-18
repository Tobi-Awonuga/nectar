export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  isActive: boolean
  onboardingStatus?: 'pending_onboarding' | 'pending_approval' | 'approved' | 'rejected'
  department?: string
  createdAt: string
}

export interface RequestUser {
  id: string
  email: string
  name: string
  department?: string | null
}

export interface Role {
  id: string
  name: string
  description?: string
}

export interface Workflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdBy?: string
  createdAt: string
  updatedAt?: string
  states?: WorkflowState[]
  transitions?: WorkflowTransition[]
}

export interface WorkflowState {
  id: string
  workflowId: string
  name: string
  label: string
  isInitial: boolean
  isFinal: boolean
  color?: string
  position: number
}

export interface WorkflowTransition {
  id: string
  workflowId: string
  fromStateId: string
  toStateId: string
  actionName: string
  actionLabel: string
}

export interface WorkflowInstance {
  id: string
  workflowId: string
  title: string
  description?: string
  currentStateId: string
  currentState?: WorkflowState
  createdBy: string
  assignedTo?: string
  ownerDepartment?: string
  ownerUserId?: string
  ownerUser?: RequestUser | null
  watchingDepartments: string[]
  visibility?: 'public' | 'private'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface WorkflowEvent {
  id: string
  instanceId: string
  eventType: string
  fromStateId?: string
  toStateId?: string
  performedBy: string
  comment?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message?: string
  isRead: boolean
  entityType?: string
  entityId?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
