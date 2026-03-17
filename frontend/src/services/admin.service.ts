import { apiClient } from './api.client'

export interface AdminUser {
  id: string
  email: string
  name: string
  isActive: boolean
  avatarUrl?: string
  createdAt: string
}

export const adminService = {
  async getUsers(): Promise<AdminUser[]> {
    const { data } = await apiClient.get<{ data: AdminUser[] }>('/users')
    return data.data
  },

  async updateUser(id: string, patch: Partial<Pick<AdminUser, 'name' | 'isActive'>>): Promise<AdminUser> {
    const { data } = await apiClient.patch<{ data: AdminUser }>(`/users/${id}`, patch)
    return data.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
