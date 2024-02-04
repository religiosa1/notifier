import pino from 'pino';

declare global {
	declare namespace NodeJS {

		export interface ProcessEnv {
			/** Port at which HTTP server will be launched */
			PORT?: string;
			/** Used in the scripts/db-seed.ts as admin's password */
			NOTIFIER_ADMIN_PWD?: string;
			/** Used in the scripts/db-seed.ts as admin's telegram Id */
			NOTIFIER_ADMIN_TGID?: string;
			/** Log level. @see {@link pino.LevelWithSilent}  */
			NOTIFIER_LOG_LEVEL?:  pino.LevelWithSilentOrString;
			/** Override the default file name of the settings file created during setup. */
			NOTIFIER_SETTINGS_FILENAME?: string;
			NODE_ENV: string;
		}
	}
}