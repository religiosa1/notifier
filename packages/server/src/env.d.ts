declare namespace NodeJS {
  export interface ProcessEnv {
    /** Telegram BOT access token */
    BOT_TOKEN: string;
    /** Public url on which will be registered `${url}/bot${TOKEN}` */
    URL: string;
    /** Generate with `npm run generate-jwt-secret` */
    JWT_SECRET: string;
    /** Database connection string */
    DATABASE_URL: string;
    /** Admin's user telegram ID. */
    ROOT_TELEGRAM_ID: number;
    /** Optional prefix to all routes (except the bot webhook) */
    PREFIX?: string;
    HOST?: string;
    PORT?: string;
    NODE_ENV: string;
  }
}