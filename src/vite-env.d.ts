/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Webhook opcional (n8n, etc.) para reflexión rechazados; véase .env.example */
  readonly VITE_FAILURE_REFLECTION_WEBHOOK_URL?: string
  /** Si `"true"`, no invoca Edge `failure-reflection`; solo webhook o borrador local */
  readonly VITE_DISABLE_FAILURE_EDGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
