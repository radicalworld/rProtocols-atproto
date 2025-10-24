/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DID_SERVER_URL?: string;
  readonly VITE_REGISTRY_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}