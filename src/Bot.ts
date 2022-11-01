import type { Update, SendMessageOptions } from "node-telegram-bot-api";
import TelegramBot from "node-telegram-bot-api";

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
  }
  setWebHook(token: string) {
    return this.bot.setWebHook(token);
  }
  processUpdate(update: Update) {
    return this.bot.processUpdate(update);
  }
  sendMessage(opts: SendMessageProps) {
    const {
      text,
      ...options
    } = opts || {};
    if (!process.env.CHATID) {
      throw new Error("Recepients chat id is not defined");
    }
    return this.bot.sendMessage(process.env.CHATID, text, options);
  }
}