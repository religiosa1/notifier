import type TelegramBot from "node-telegram-bot-api";
import type { Message } from "node-telegram-bot-api";
import { esc } from "src/util/esc";
import { reEscape } from "@shared/helpers/reEscape";
import type { BaseLogger } from "pino";

const wordRegEx = /[a-zA-Z][\w_]+/;

type MessageHandler = (context: {
	bot: TelegramBot,
	logger: BaseLogger
}, msg: Message, match: RegExpExecArray | null) => void | Promise<void>;

export class BotCommand {
	public hidden = false;
	constructor(
		public command: string,
		public description: string,
		public handler: MessageHandler,
		public args: string[] = [],
		{
			hidden = false
		} = {}
	) {
		if (!wordRegEx.test(command)) {
			throw new Error(esc`Command ${command} doesn't match the required format`);
		}
		for (const arg of args) {
			if (!wordRegEx.test(arg)) {
				throw new Error(esc`Argument ${arg} of Command ${command} doesn't match the required format`);
			}
		}
		this.hidden = hidden;
	}

	get pattern(): RegExp {
		return new RegExp("^\/" + [
			reEscape(this.command),
			...this.args.map(() => '[a-zA-Z][\w_]+')
		].join('\s+'));
	}

	toTelegramCommand(): TelegramBot.BotCommand {
		return {
			command: this.command,
			description: this.description,
		};
	}
}