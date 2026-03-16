import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nectar_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nectar_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
