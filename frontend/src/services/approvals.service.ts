import { apiClient } from './api.client'

export interface PendingApproval {
  id: string
  workflowId: string
  title: string
  description?: string
  currentStateId: string
  currentState: { id: string; label: string; color: string | null } | null
  createdBy: string
  createdByUser: { id: string; name: string } | null
  assignedTo?: string
  priority: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export const approvalsService = {
  async getPending(): Promise<PendingApproval[]> {
    const { data } = await apiClient.get<{ data: PendingApproval[] }>('/approvals/pending')
    return data.data
  },

  async approve(id: string, comment?: string): Promise<void> {
    await apiClient.post(`/approvals/${id}/approve`, { comment })
  },

  async reject(id: string, comment?: string): Promise<void> {
    await apiClient.post(`/approvals/${id}/reject`, { comment })
  },
}
