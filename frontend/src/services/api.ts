import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

declare global {
  interface Window { __API_URL__?: string; }
}

const apiBaseURL = (typeof window !== 'undefined' && window.__API_URL__) || import.meta.env.VITE_API_URL || '';

const api: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const authStore = useAuthStore.getState();

  if (authStore.studentId) {
    config.headers['X-Student-Id'] = authStore.studentId;
  }
  if (authStore.adminKey) {
    config.headers['X-Admin-Key'] = authStore.adminKey;
  }
  if (authStore.professorKey) {
    config.headers['X-Professor-Key'] = authStore.professorKey;
  }
  if (authStore.superAdminKey) {
    config.headers['X-Super-Admin-Key'] = authStore.superAdminKey;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      const detail = error.response?.data?.detail || 'Accès non autorisé';
      console.error('Auth error:', detail);
    }
    return Promise.reject(error);
  }
);

export default api;
