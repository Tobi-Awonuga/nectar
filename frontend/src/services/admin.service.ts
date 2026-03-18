import { apiClient } from './api.client'

export interface AdminUser {
  id: string
  email: string
  name: string
  department: string | null
  isActive: boolean
  avatarUrl?: string
  createdAt: string
}

export interface AdminRole {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface DepartmentDefaultAssignee {
  department: string
  userId: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    department: string | null
  } | null
}

export const adminService = {
  async getUsers(): Promise<AdminUser[]> {
    const { data } = await apiClient.get<{ data: AdminUser[] }>('/users')
    return data.data
  },

  async updateUser(id: string, patch: Partial<Pick<AdminUser, 'name' | 'isActive' | 'department'>>): Promise<AdminUser> {
    const { data } = await apiClient.patch<{ data: AdminUser }>(`/users/${id}`, patch)
    return data.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },

  async getRoles(): Promise<AdminRole[]> {
    const { data } = await apiClient.get<{ data: AdminRole[] }>('/users/roles')
    return data.data
  },

  async getUserRoles(userId: string): Promise<AdminRole[]> {
    const { data } = await apiClient.get<{ data: AdminRole[] }>(`/users/${userId}/roles`)
    return data.data
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/roles`, { roleId })
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/roles/${roleId}`)
  },

  async getDepartmentDefaults(): Promise<DepartmentDefaultAssignee[]> {
    const { data } = await apiClient.get<{ data: DepartmentDefaultAssignee[] }>('/department-defaults')
    return data.data
  },

  async setDepartmentDefault(department: string, userId: string): Promise<DepartmentDefaultAssignee> {
    const { data } = await apiClient.put<{ data: DepartmentDefaultAssignee }>('/department-defaults', {
      department,
      userId,
    })
    return data.data
  },
}
