/// <reference types="vite/client" />
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const timetableApi = {
  list:       ()           => apiClient.get('/timetables'),
  get:        (id: string) => apiClient.get(`/timetables/${id}`),
  create:     (data: unknown) => apiClient.post('/timetables', data),
  update:     (id: string, data: unknown) => apiClient.put(`/timetables/${id}`, data),
  delete:     (id: string) => apiClient.delete(`/timetables/${id}`),
  generate:   (data: unknown) => apiClient.post('/timetables/generate', data),
  export:     (id: string, format: 'xlsx' | 'pdf') => apiClient.post(`/timetables/${id}/export?format=${format}`),
  substitute: (id: string, data: unknown) => apiClient.post(`/timetables/${id}/substitute`, data),
}
