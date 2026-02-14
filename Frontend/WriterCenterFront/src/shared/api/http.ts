import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from '../lib/env';
import { endpoints } from './endpoints';

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
  withCredentials: true, // Required for HttpOnly refresh token cookie
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
        // Official contract: refresh token is sent automatically via HttpOnly cookie.
        const response = await axios.post(
          `${env.apiUrl}${endpoints.auth.tokenRefresh}`,
          {},
          { withCredentials: true }
        );

        const accessToken = response.data?.accessToken ?? response.data?.access_token;
        if (!accessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }
        setAccessToken(accessToken);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return http(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to SSO
        clearTokens();
        window.location.href = '/';
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

export function getAccessToken(): string | null {
  return accessTokenCache;
}

export function setAccessToken(token: string): void {
  accessTokenCache = token;
}

export function setTokens(accessToken: string): void {
  setAccessToken(accessToken);
}

export function clearTokens(): void {
  accessTokenCache = null;
}
