import type { Update, SendMessageOptions } from "node-telegram-bot-api";
export type { Update };
import TelegramBot from "node-telegram-bot-api";
import { botCommands } from "./BotCommands";
import { logger } from "src/logger";

export const chats = (process.env.CHATID ?? "")
  .split(',')
  .map(i => i.trim())
  .filter(i => i);

export interface SendMessageProps extends SendMessageOptions {
  text: string;
};

export class Bot {
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
  setWebHook(token: string) {
    return this.bot.setWebHook(token);
  }
  processUpdate(update: Update) {
    return this.bot.processUpdate(update);
  }
  async sendMessage(opts: SendMessageProps) {
    logger.trace('sending a telegram message', opts);
    const {
      text,
      ...options
    } = opts || {};
    if (!process.env.CHATID) {
      throw new Error("Recepients chat id is not defined");
    }
    const msgs = await Promise.allSettled(
      chats.map(chat => this.bot.sendMessage(chat, text, options).catch(e => {
        logger.error({event:"error", detail: chat, text: text, error: e});
      }))
    );
    logger.info({ massSend: msgs });
    return msgs;
  }
}