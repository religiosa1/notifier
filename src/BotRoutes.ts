import TelegramBot, { Message } from "node-telegram-bot-api";
import { app } from "../index";

interface Route {
  pattern: RegExp,
  handler: (this: TelegramBot, msg: Message, match: RegExpExecArray | null) => void;
}

export const botRoutes: Route[] = [
  {
    pattern: /^\/start/,
    handler(this: TelegramBot, msg: Message) {
      this.sendMessage(msg.chat.id, "Спасибо, мы подумаем и решим, достойны ли вы пользоваться нашим ботом.");
      app.log.info("start command", msg.chat);
    }
  }
];