/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** REQUIRED: backend connection url */
  readonly API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}