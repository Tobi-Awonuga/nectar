import { apiClient } from './api.client'

export interface PendingOnboardingUser {
  user: {
    id: string
    email: string
    name: string
    department: string | null
    onboardingStatus: string
    createdAt: string
  }
  requestId: string
  requestedAt: string
}

export const onboardingService = {
  async submit(data: { firstName: string; lastName: string; department: string }): Promise<void> {
    await apiClient.post('/onboarding', data)
  },

  async getPending(): Promise<PendingOnboardingUser[]> {
    const { data } = await apiClient.get<{ data: PendingOnboardingUser[] }>('/onboarding/pending')
    return data.data
  },

  async approve(userId: string): Promise<void> {
    await apiClient.post(`/onboarding/${userId}/approve`)
  },

  async reject(userId: string, notes?: string): Promise<void> {
    await apiClient.post(`/onboarding/${userId}/reject`, { notes })
  },
}
