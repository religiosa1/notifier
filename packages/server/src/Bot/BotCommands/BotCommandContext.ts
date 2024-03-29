import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import type { BaseLogger } from "pino";
import { BotCommandError } from "src/Bot/BotCommands/BotErrors";
import { di } from "src/injection";


type Shift<T extends any[]> = ((...args: T) => any) extends (arg: any, ...rest: infer R) => any ? R : never;

export interface BotCommandContext {
	/** Send message back to the message's author. */
	reply: (...args: Shift<Parameters<TelegramBot["sendMessage"]>>) => ReturnType<TelegramBot["sendMessage"]>;
	/** UserId, can be NaN for noAuth commands */
	userId: number;
	msg: Message;
	bot: TelegramBot;
	logger: BaseLogger;
}

export class BotCommandContextFactory {
	constructor(
		public bot: TelegramBot,
		public logger: BaseLogger,
		private readonly usersRepository = di.inject("UsersRepository"),
	) {}

	async createContext(msg: Message, omitAuth = false): Promise<BotCommandContext> {
		const reply = this.bot.sendMessage.bind(this.bot, msg.chat.id);
		const userId = await this.usersRepository.getAuthorizedUserIdByTgId(msg.chat.id);
		if (!omitAuth && userId === undefined) {
			throw new BotCommandError("You're not authorized to use this command.");
		}

		return {
			bot: this.bot,
			logger: this.logger,
			reply,
			userId: userId ?? NaN,
			msg,
		}
	}
}