import TelegramBot, { Message } from "node-telegram-bot-api";
import { logger } from "src/logger";

interface BotCommand {
  pattern: RegExp,
  handler: (this: TelegramBot, msg: Message, match: RegExpExecArray | null) => void;
}

/** Available bot commands */
export const botCommands: BotCommand[] = [
  {
    pattern: /^\/start/,
    handler(this: TelegramBot, msg: Message) {
      this.sendMessage(msg.chat.id, "Спасибо, мы подумаем и решим, достойны ли вы пользоваться нашим ботом.");
      logger.info({ event: "start command", chat: msg.chat });
    }
  }
];