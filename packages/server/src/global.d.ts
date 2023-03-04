declare namespace NodeJS {
  export interface ProcessEnv {
    BOT_TOKEN: string;
    /** base url of the notifier service */
    URL: string;
    HOST: string;
    PORT: string;
    JWT_SECRET: string;
    NODE_ENV: string;
  }
}