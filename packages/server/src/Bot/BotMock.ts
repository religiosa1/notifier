import type { Bot } from "./Bot";
import { logger } from "src/logger";

/** Basic mock of Bot class for testing purposes */
export class BotMock {
  constructor(token: string) {
    if (!token) {
      throw new Error("Bot token isn't present in the env variables");
    }
    logger.info(`Telegram bot MOCK initialized with token "${token}"`)
  }
  setWebHook(_: string) {}
  processUpdate(..._: Parameters<Bot['processUpdate']>) {}
  sendMessage(...args: Parameters<Bot['sendMessage']>): ReturnType<Bot['sendMessage']> {
    logger.trace('sending a telegram message', ...args);
    return Promise.allSettled([
      {
        message_id: Math.floor(Math.random() * 1e9),
        date: new Date().getTime(),
        chat: {
          id: 0,
          type: 'private',
        }
      }
    ]);
  }
}