import TelegramBot from "node-telegram-bot-api";
import type { Update, Message } from "node-telegram-bot-api";
export type { Update };
import type { IBot, SendMessageProps } from "src/Bot/Models";
import { botCommands } from "./BotCommands";
import { logger } from "src/logger";

export class Bot implements IBot {
  bot: TelegramBot;

  constructor(token: string) {
    if (!token) {
      throw new Error("Bot token isn't supplied! (is it defined in env variables?)");
    }
    this.bot = new TelegramBot(token);

    botCommands.forEach(command => {
      this.bot.onText(
        command.pattern,
        (...args) => command.handler.call(this.bot, ...args)
      );
    });
    logger.info(`Telegram bot initialized with token "${token}"`)
  }
  async setWebHook(token: string): Promise<void> {
    await this.bot.setWebHook(token);
  }
  processUpdate(update: Update): void {
    return this.bot.processUpdate(update);
  }
  async sendMessage(
    chats: Array<string | number>, opts: SendMessageProps
  ): Promise<PromiseSettledResult<void | Message>[]> {
    logger.trace("sending a telegram message", opts);
    const {
      text,
      ...options
    } = opts || {};
		// TODO PromisePool to process sends in chunks
    const msgs = await Promise.allSettled(
      chats.map(chat => this.bot.sendMessage(chat, text, options).catch(e => {
        logger.error({event: "error", detail: chat, text: text, error: e});
      }))
    );
    logger.info({ massSend: msgs });
    return msgs;
  }
}