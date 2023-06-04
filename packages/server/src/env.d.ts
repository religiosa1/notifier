declare namespace NodeJS {
  export interface ProcessEnv {
    /** Telegram BOT access token */
    BOT_TOKEN: string;
    /** base url of the notifier service */
    URL: string;
    HOST: string;
    PORT: string;
    /** Generate with `npm run generate-jwt-secret` */
    JWT_SECRET: string;
    /** Database connection string */
    DATABASE_URL: string;
    /** Admin's user telegram ID. */
    ROOT_TELEGRAM_ID: number;
    NODE_ENV: string;

  }
}