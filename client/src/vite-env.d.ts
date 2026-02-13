/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Declarações globais para evitar erros do TypeScript
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any
  }
}

export {}