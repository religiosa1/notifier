import type { Update } from "node-telegram-bot-api";
import TelegramBot from "node-telegram-bot-api";

export class BotMock {
  constructor(token: string) {
    if (!token) {
      throw new Error("Bot token isn't present in the env variables");
    }
  }
  setWebHook(token: string) {}
  processUpdate(update: Update) {}
  sendMessage(...args: Parameters<TelegramBot['sendMessage']>): ReturnType<TelegramBot['sendMessage']> {
    console.log('sending a telegram message', ...args);
    return Promise.resolve({
      message_id: Math.floor(Math.random() * 1e9),
      date: new Date().getTime(),
      chat: {
        id: 0,
        type: 'private',
      }
    });
  }
}