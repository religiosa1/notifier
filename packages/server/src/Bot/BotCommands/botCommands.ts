import { db } from "src/db";
import { createUser, getUserIdByTgId, userExistsByTgId } from "src/services/UserService";
import * as ApiKeyService from "src/services/ApiKey";
import * as UserChannelsService from "src/services/UserChannels";
import { BotCommand } from "./BotCommand";

/** Available bot commands */
export const botCommands: BotCommand[] = [
  new BotCommand(
    "start",
    "",
    async ({ bot, logger }, msg) => {
      logger.info({ event: "start command", chat: msg.chat });
      if (!msg.from) {
        bot.sendMessage(msg.chat.id, "У вас какой-то странный чат, не могу найти от кого сообщение");
        return;
      }

      if (await userExistsByTgId(db, msg.from.id)) {
        bot.sendMessage(msg.chat.id, "Вы и так уже здесь, чего вам ещё надо?git");
      } else {
        createUser(db, {
          name: msg.from.username,
          telegramId: msg.from.id,
        });
        bot.sendMessage(msg.chat.id, "Спасибо, мы подумаем и решим, достойны ли вы пользоваться нашим ботом.");
      }
    },
    [],
    { hidden: true }
  ),
  // ---------------------------------------------------------------------------
  // Channels
  new BotCommand(
    "list_all_channels",
    "List notification channels available to you",
    async ({ bot }, msg) => {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const channels = await UserChannelsService.availableChannels(db, userId);
      bot.sendMessage(msg.chat.id,
        "Доступные каналы\n" + channels.map(i => i.name).join('\n'),
      );
    }
  ),
  new BotCommand(
    "list_channels",
    "List notification channels you're currently subscribed",
    async ({ bot }, msg) => {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const [channels] = await UserChannelsService.getUserChannels(db, userId);
      bot.sendMessage(msg.chat.id,
        "Текущие каналы\n" +channels.map(i => i.name).join('\n'),
      );
    }
  ),
  new BotCommand(
    "join_channel",
    "Join a notification channel",
    async (_, _msg) => {
      throw new Error("TODO");
    },
    [ "CHANNEL" ],
  ),
  new BotCommand(
    "leave_channel",
    "Leave a notification channel",
    async (_, _msg) => {
      throw new Error("TODO");
    },
    [ "CHANNEL" ],
  ),
  // ---------------------------------------------------------------------------
  // Keys
  new BotCommand(
    "list_keys",
    "List your API keys to the bot",
    async ({ bot }, msg) => {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const [apiKeys] = await ApiKeyService.getKeys(db, userId, {skip: 0, take: 999});
      bot.sendMessage(msg.chat.id,
        "Доступные ключи\n" + apiKeys.map(i => i.prefix).join('\n'),
      );
    }
  ),
  new BotCommand(
    "new_key",
    "Generate a new API key",
    async ({ bot }, msg) => {
      const userId = await getUserIdByTgId(db, msg.chat.id);
      const apiKey = await ApiKeyService.createKey(db, userId);
      bot.sendMessage(msg.chat.id,
        "Вот ваш ключ.\n" + apiKey,
      )
    }
  ),
  new BotCommand(
    "remove_key",
    "remove an API key",
    async (_bot, _msg) => {
      throw new Error("TODO");
    },
    [ "KEY" ],
  ),
];