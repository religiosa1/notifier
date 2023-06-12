import { esc } from "src/util/esc";
import { logger } from "src/logger";
import type { Bot } from "./Bot";
import type { IBot } from "./Models";

/** Basic mock of Bot class for testing purposes */
export class BotMock implements IBot {
  constructor(token: string) {
    if (!token) {
      throw new Error("Bot token isn't present in the env variables");
    }
    logger.info(esc`MOCK Telegram bot initialized with token ${token}. It's a MOCK it won't do anything`)
  }
  async init() {}
  async setWebHook(_: string) {
    logger.info(`MOCK HOOK being set`)
  }
  processUpdate(..._: Parameters<Bot["processUpdate"]>) {}
  sendMessage(...args: Parameters<Bot["sendMessage"]>): ReturnType<Bot["sendMessage"]> {
    logger.trace('sending a MOCK telegram message', ...args);
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