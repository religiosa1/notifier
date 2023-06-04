import type TelegramBot from "node-telegram-bot-api";
import type { Message } from "node-telegram-bot-api";
import { db } from "src/db";
import { logger } from "src/logger";
import { createUser, getUserIdByTgId } from "src/services/UserService";
import * as ApiKeyService from "src/services/ApiKey";
import * as UserChannelsService from "src/services/UserChannels";

interface BotCommand {
  pattern: RegExp,
  handler: (this: TelegramBot, msg: Message, match: RegExpExecArray | null) => void | Promise<void>;
}

/** Available bot commands */
export const botCommands: BotCommand[] = [
  {
    pattern: /^\/start$/,
    async handler(this: TelegramBot, msg: Message) {
      logger.info({ event: "start command", chat: msg.chat });
      if (!msg.from) {
        this.sendMessage(msg.chat.id, "У вас какой-то странный чат, не могу найти от кого сообщение");
        return;
      }
      createUser(db, {
        name: msg.from.username,
        telegramId: msg.from.id,
      });
      this.sendMessage(msg.chat.id, "Спасибо, мы подумаем и решим, достойны ли вы пользоваться нашим ботом.");
    }
  },
  {
    pattern: /^\/new-key$/,
    async handler(this: TelegramBot, msg: Message) {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const apiKey = await ApiKeyService.createKey(db, userId);
      this.sendMessage(msg.chat.id,
        "Вот ваш ключ.\n" + apiKey,
      )
    }
  },
  {
    pattern: /^\/list-keys$/,
    async handler(this: TelegramBot, msg: Message) {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const [apiKeys] = await ApiKeyService.getKeys(db, userId, {skip: 0, take: 999});
      this.sendMessage(msg.chat.id,
        "Доступные ключи\n" + apiKeys.map(i => i.prefix).join('\n'),
      );
    }
  },
  {
    pattern: /^\/remove-key\s+(\w+)$/,
    async handler(this: TelegramBot, msg: Message) {
      throw new Error("TODO");
    }
  },
  {
    pattern: /^\/list-channels-all$/,
    async handler(this: TelegramBot, msg: Message) {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const channels = await UserChannelsService.availableChannels(db, userId);
      this.sendMessage(msg.chat.id,
        "Доступные каналы\n" + channels.map(i => i.name).join('\n'),
      );
    }
  },
  {
    pattern: /^\/list-channels$/,
    async handler(this: TelegramBot, msg: Message) {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const [channels] = await UserChannelsService.getUserChannels(db, userId);
      this.sendMessage(msg.chat.id,
        "Текущие каналы\n" +channels.map(i => i.name).join('\n'),
      );
    }
  },
  {
    pattern: /^\/join-channel\s+(\w+)$/,
    async handler(this: TelegramBot, msg: Message) {
      throw new Error("TODO");
    }
  },
  {
    pattern: /^\/leave-channel\s+(\w+)$/,
    async handler(this: TelegramBot, msg: Message) {
      throw new Error("TODO");
    }
  },
];