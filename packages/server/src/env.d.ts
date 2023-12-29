declare namespace NodeJS {
	export interface ProcessEnv {
		PORT?: string;
		NODE_ENV: string;

		/** Used in the scripts/db-seed.ts as admin's password */
		NOTIFIER_ADMIN_PWD?: string;
	}
}