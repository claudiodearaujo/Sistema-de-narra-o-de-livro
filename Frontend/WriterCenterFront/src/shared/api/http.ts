import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../lib/env';

/**
 * Axios instance configured for the Livrya API
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Id': env.ssoClientId,
  },
  withCredentials: true, // For cookies (refresh token)
});

/**
 * Request interceptor to add auth token
 */
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle token refresh
 */
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(
          `${env.apiUrl}/auth/token/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        setAccessToken(accessToken);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return http(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Token management functions
 * These should be replaced with actual implementation from auth store
 */
let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;

export function getAccessToken(): string | null {
  return accessTokenCache || localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return refreshTokenCache || localStorage.getItem('refresh_token');
}

export function setAccessToken(token: string): void {
  accessTokenCache = token;
  localStorage.setItem('access_token', token);
}

export function setRefreshToken(token: string): void {
  refreshTokenCache = token;
  localStorage.setItem('refresh_token', token);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

export function clearTokens(): void {
  accessTokenCache = null;
  refreshTokenCache = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
