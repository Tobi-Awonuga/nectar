import { apiClient } from './api.client'
import type { User } from '../types/domain.types'

export const authService = {
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<{ data: User }>('/auth/me')
    return data.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
    localStorage.removeItem('nectar_token')
  },
}
