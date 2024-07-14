import pino from 'pino';

declare global {
	declare namespace NodeJS {
		export interface ProcessEnv {
			/** Main URL for accesssing the app */
			PUBLIC_URL?: string;
			/** Port at which HTTP server will be launched */
			PORT?: string;
			/** Used in the scripts/db-seed.ts as admin's password */
			NOTIFIER_ADMIN_PWD?: string;
			/** Used in the scripts/db-seed.ts as admin's telegram Id */
			NOTIFIER_ADMIN_TGID?: string;
			/** Log level. @see {@link pino.LevelWithSilent}  */
			NOTIFIER_LOG_LEVEL?:  pino.LevelWithSilentOrString;
			/** Telegram bot token, as provided by bot father */
			BOT_TOKEN: string;
			/** JWT secret for signing JWT authorization token */
			JWT_SECRET: string;
			/** Optional secret for authenticating telegram webhook requests */
			TG_HOOK_SECRET?: string;
			/** Path to database sqlite3 file  */
			DB_FILE?: string;
			NODE_ENV: string;
		}
	}
}