export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  ssoUrl: import.meta.env.VITE_SSO_URL || 'http://localhost:4200/auth/sso/authorize',
  ssoClientId: import.meta.env.VITE_SSO_CLIENT_ID || 'livrya-writer-studio',
  ssoRedirectUri: import.meta.env.VITE_SSO_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:4200',
  writerUrl: import.meta.env.VITE_WRITER_URL || 'http://localhost:5173',
} as const;
