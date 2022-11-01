import { app } from "index";
import type { Update, SendMessageOptions } from "node-telegram-bot-api";
import TelegramBot from "node-telegram-bot-api";
import { botRoutes } from "./BotRoutes";

export const chats = (process.env.CHATID ?? "")
  .split(',')
  .map(i => i.trim())
  .filter(i => i);

type SendMessageProps = {
  text: string;
} & SendMessageOptions;

export class Bot {
  bot: TelegramBot;

  constructor(token: string) {
    if (!token) {
      throw new Error("Bot token isn't supplied! (is it defined in env variables?)");
    }
    this.bot = new TelegramBot(token);

    botRoutes.forEach(route => {
      this.bot.onText(
        route.pattern,
        (...args) => route.handler.call(this.bot, ...args)
      );
    });
  }
  setWebHook(token: string) {
    return this.bot.setWebHook(token);
  }
  processUpdate(update: Update) {
    return this.bot.processUpdate(update);
  }
  async sendMessage(opts: SendMessageProps) {
    const {
      text,
      ...options
    } = opts || {};
    if (!process.env.CHATID) {
      throw new Error("Recepients chat id is not defined");
    }
    const msgs = await Promise.all(
      chats.map(chat => this.bot.sendMessage(chat, text, options).catch(e => {
        app.log.error({event:"error", detail: chat, text: text, error: e});
      }))
    );
    app.log.info({ massSend: msgs });
    return msgs;
  }
}