import TelegramBot from "node-telegram-bot-api";
import type { Update, Message } from "node-telegram-bot-api";
import type { IBot, SendMessageProps } from "src/Bot/Models";
import type { BaseLogger } from "pino";
import { di } from "src/injection";
import { asyncPool } from "src/util/asyncPool";
import { esc } from "src/util/esc";
import { BotCommandContextFactory } from "src/Bot/BotCommands/BotCommandContext";
import { BotCommandError } from "src/Bot/BotCommands/BotErrors";
import { botCommands } from "./BotCommands";

export type { Update };

export class Bot implements IBot {
	bot: TelegramBot;
	#commandContextFactory: BotCommandContextFactory;

	constructor(
		token: string,
		private readonly logger: BaseLogger = di.inject("logger"),
	) {
		if (!token) {
			throw new Error("Bot token isn't supplied! (is it defined in env variables?)");
		}
		this.bot = new TelegramBot(token);
		this.#commandContextFactory = new BotCommandContextFactory(this.bot, logger);

		botCommands.forEach(command => {
			this.bot.onText(
				command.pattern,
				async (msg, match) => {
					try {
						const context = await this.#commandContextFactory.createContext(msg);
						const args = command.extractArgs(match);
						await command.handler(context, args);
					} catch(e) {
						if (e instanceof BotCommandError) {
							this.bot.sendMessage(msg.chat.id, e.message);
							return;
						}
						await Promise.all([
							logger.error("Command execution failed", command.command, msg, match, e),
							this.bot.sendMessage(msg.chat.id, "Command execution failed: " + String(e)),
						]);
					}
				},
			);
		});
		logger.info(esc`Telegram bot initialized with token ${token}`, botCommands)
	}

	async [Symbol.asyncDispose]() {
		await this.destroy();
	}
	async destroy(): Promise<void> {
		await this.bot.close();
	}

	async init(): Promise<void> {
		const publicCommands = botCommands.filter(i => !i.hidden);
		this.bot.setMyCommands(publicCommands.map(i => i.toTelegramCommand()));
	}

	async setWebHook(token: string): Promise<void> {
		await this.bot.setWebHook(token);
	}

	processUpdate(update: Update): void {
		return this.bot.processUpdate(update);
	}

	async broadcastMessage(
		chats: Array<string | number>, opts: SendMessageProps
	): Promise<PromiseSettledResult<void | Message>[]> {
		this.logger.trace("sending a telegram message", opts);
		const {
			text,
			...options
		} = opts || {};

		const self = this;
		const bot = this.bot;
		const msgs = await asyncPool(function* () {
			for (const chat of chats) {
				yield bot.sendMessage(chat, text, options).catch((e: unknown) => {
					self.logger.error({ event: "error", detail: chat, text: text, error: e });
					throw e;
				});
			}
		}(), 50);

		this.logger.info({ massSend: msgs });
		return msgs;
	}
}