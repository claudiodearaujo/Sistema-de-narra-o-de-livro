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
  withCredentials: true, // For cookies (refresh token)
});

// Track refresh attempts to prevent infinite loops
let isRefreshing = false;
let failedRefreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_COOLDOWN = 5000; // 5 seconds
let lastRefreshAttempt = 0;

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
      // Check if we're already refreshing or hit the max attempts
      if (isRefreshing) {
        return Promise.reject(error);
      }

      // Check cooldown period
      const now = Date.now();
      if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
        console.warn('[HTTP] Token refresh on cooldown, rejecting request');
        handleSessionExpired();
        return Promise.reject(error);
      }

      // Check max attempts
      if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error('[HTTP] Max refresh attempts reached, session expired');
        handleSessionExpired();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;
      lastRefreshAttempt = now;

      try {
        const response = await axios.post(
          `${env.apiUrl}${endpoints.auth.tokenRefresh}`,
          {},
          { withCredentials: true }
        );

        const accessToken = response.data?.accessToken ?? response.data?.access_token;
        const expiresIn = response.data?.expiresIn ?? response.data?.expires_in ?? 172800; // Default: 2 days
        
        if (!accessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }
        
        setAccessToken(accessToken);
        
        // Update auth store with new token
        const { useAuthStore } = await import('../stores/auth.store');
        useAuthStore.getState().setTokens({ accessToken, expiresIn });

        // Reset failure counter on success
        failedRefreshAttempts = 0;
        isRefreshing = false;

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return http(originalRequest);
      } catch (refreshError) {
        // Refresh failed, increment counter
        failedRefreshAttempts++;
        isRefreshing = false;
        
        console.error('[HTTP] Token refresh failed', refreshError);
        
        // If we've exhausted all attempts, handle session expiry
        if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
          handleSessionExpired();
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Handle session expiration - clear auth and redirect
 */
function handleSessionExpired() {
  console.log('[HTTP] Session expired, clearing auth and redirecting');
  
  // Clear tokens
  clearTokens();
  
  // Clear auth store
  import('../stores/auth.store').then(({ useAuthStore }) => {
    useAuthStore.getState().logout();
  });
  
  // Reset refresh tracking
  failedRefreshAttempts = 0;
  isRefreshing = false;
  
  // Redirect to login
  window.location.href = '/';
}

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
