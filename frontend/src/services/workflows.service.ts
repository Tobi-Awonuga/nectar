import { apiClient } from './api.client'
import type { Workflow, WorkflowInstance, PaginatedResponse } from '../types/domain.types'

export const workflowsService = {
  async getWorkflows(): Promise<Workflow[]> {
    const { data } = await apiClient.get<{ data: Workflow[] }>('/workflows')
    return data.data
  },

  async getInstances(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<WorkflowInstance>> {
    const { data } = await apiClient.get<PaginatedResponse<WorkflowInstance>>('/tasks', { params })
    return data
  },

  async getInstance(id: string): Promise<WorkflowInstance> {
    const { data } = await apiClient.get<{ data: WorkflowInstance }>(`/tasks/${id}`)
    return data.data
  },

  async createInstance(payload: { workflowId: string; title: string; description?: string; priority?: string }): Promise<WorkflowInstance> {
    const { data } = await apiClient.post<{ data: WorkflowInstance }>('/tasks', payload)
    return data.data
  },

  async transition(instanceId: string, actionName: string, comment?: string): Promise<WorkflowInstance> {
    const { data } = await apiClient.post<{ data: WorkflowInstance }>(`/tasks/${instanceId}/transition`, { actionName, comment })
    return data.data
  },
}
