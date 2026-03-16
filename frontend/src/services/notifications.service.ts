import { apiClient } from './api.client'
import type { Notification, PaginatedResponse } from '../types/domain.types'

export const notificationsService = {
  async getAll(): Promise<PaginatedResponse<Notification>> {
    const { data } = await apiClient.get<PaginatedResponse<Notification>>('/notifications')
    return data
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  },
}
