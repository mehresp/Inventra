/**
 * API Client with Axios configuration
 */
import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

// Use relative URL when served via nginx (Docker/production) so API goes through proxy.
// For local dev, VITE_API_BASE_URL can be set to 'http://localhost:8000/api/v1' or use vite proxy with '/api/v1'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function to handle API errors (400, 403, etc.)
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError<ApiError>(error)) {
    const apiError = error.response?.data;
    if (apiError?.error) {
      const msg = apiError.error.message || 'An error occurred';
      const details = apiError.error.details;
      // For 400 validation errors, details may contain field-level errors
      if (details && typeof details === 'object' && !('detail' in details)) {
        const fieldErrors = Object.entries(details)
          .filter(([, v]) => Array.isArray(v) && v.length > 0)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join('; ');
        return fieldErrors || msg;
      }
      return msg;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
};

