import TelegramBot from "node-telegram-bot-api";
import type { Update, Message } from "node-telegram-bot-api";
export type { Update };
import type { IBot, SendMessageProps } from "src/Bot/Models";
import { botCommands } from "./BotCommands";
import { logger } from "src/logger";
import { esc } from "src/util/esc";
import { asyncPool } from "src/util/asyncPool";

export class Bot implements IBot {
  bot: TelegramBot;

  constructor(token: string) {
    if (!token) {
      throw new Error("Bot token isn't supplied! (is it defined in env variables?)");
    }
    this.bot = new TelegramBot(token);
    const handlerContext = {
      bot: this.bot,
      logger,
    }
    botCommands.forEach(command => {
      this.bot.onText(
        command.pattern,
        (...args) => command.handler(handlerContext, ...args)
      );
    });

    const publicCommands = botCommands.filter(i => !i.hidden);
    this.bot.setMyCommands(publicCommands.map(i => i.toTelegramCommand()));
    logger.info(esc`Telegram bot initialized with token ${token}`)
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

    const bot = this.bot;
    const msgs = await asyncPool(function*() {
      for (const chat of chats) {
        yield bot.sendMessage(chat, text, options).catch((e: unknown) => {
          logger.error({event: "error", detail: chat, text: text, error: e});
          throw e;
        });
      }
    }(), 20);

    logger.info({ massSend: msgs });
    return msgs;
  }
}