/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** REQUIRED: backend connection url */
  readonly API_URL: string;
	/** Optional initial database connection url value for the setup page */
  readonly DB_URL: stirng;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}