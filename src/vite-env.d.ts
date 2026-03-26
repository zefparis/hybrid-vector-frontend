/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Gardé uniquement si utilisé ailleurs (non requis pour la vitrine actuellement).
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
