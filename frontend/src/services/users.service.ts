import { apiClient } from './api.client'
import type { RequestUser } from '@/types/domain.types'

export const usersService = {
  async getDirectory(params?: { department?: string }): Promise<RequestUser[]> {
    const { data } = await apiClient.get<{ data: RequestUser[] }>('/users/directory', { params })
    return data.data
  },
}
