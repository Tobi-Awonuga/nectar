import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/msal'
import { apiClient } from '../services/api.client'
import type { User } from '../types/domain.types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance } = useMsal()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount — try to restore session from stored Nectar token
  useEffect(() => {
    const token = localStorage.getItem('nectar_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    apiClient
      .get<{ data: User }>('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('nectar_token')
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login() {
    // Step 1: Microsoft SSO popup
    const result = await instance.loginPopup(loginRequest)

    // Step 2: Exchange Microsoft ID token for a Nectar JWT
    const { data } = await apiClient.post<{ data: { token: string; user: User } }>(
      '/auth/login',
      { idToken: result.idToken },
    )

    // Step 3: Store the Nectar token — api.client interceptor picks it up automatically
    localStorage.setItem('nectar_token', data.data.token)
    setUser(data.data.user)
  }

  async function refreshUser() {
    try {
      const res = await apiClient.get<{ data: User }>('/auth/me')
      setUser(res.data.data)
    } catch {
      // silent
    }
  }

  async function logout() {
    await apiClient.post('/auth/logout')
    localStorage.removeItem('nectar_token')
    setUser(null)
    await instance.logoutPopup()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
