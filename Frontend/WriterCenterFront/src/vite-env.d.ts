/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_SSO_URL: string
  readonly VITE_SSO_CLIENT_ID: string
  readonly VITE_SSO_REDIRECT_URI: string
  readonly VITE_APP_URL: string
  readonly VITE_WRITER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
