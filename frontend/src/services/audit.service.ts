import { apiClient } from './api.client'

export interface AuditEvent {
  id: string
  instanceId: string
  instanceTitle: string | null
  eventType: string
  fromStateLabel: string | null
  toStateLabel: string | null
  performerName: string | null
  comment: string | null
  createdAt: string
}

export const auditService = {
  async getAll(): Promise<AuditEvent[]> {
    const { data } = await apiClient.get<{ data: AuditEvent[] }>('/audit')
    return data.data
  },

  async getByInstance(instanceId: string): Promise<AuditEvent[]> {
    const { data } = await apiClient.get<{ data: AuditEvent[] }>(`/audit/${instanceId}`)
    return data.data
  },
}
