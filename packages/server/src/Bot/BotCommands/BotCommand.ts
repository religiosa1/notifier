import type TelegramBot from "node-telegram-bot-api";
import type { BotCommandContext } from "src/Bot/BotCommands/BotCommandContext";
import { esc } from "src/util/esc";
import { reEscape } from "@shared/helpers/reEscape";

const wordRegEx = /[a-zA-Z][\w_]+/;

type MessageHandler = (
	context: BotCommandContext,
	args: string[],
) => void | Promise<void>;

export class BotCommand {
	public hidden = false;
	public noAuth = false;
	constructor(
		public command: string,
		public description: string,
		public handler: MessageHandler,
		public args: string[] = [],
		{
			hidden = false,
			noAuth = false,
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
		this.noAuth = noAuth;
	}

	get pattern(): RegExp {
		return new RegExp("^\/" + [
			reEscape(this.command),
			...this.args.map(() => '\w*')
		].join('\s+'));
	}

	toTelegramCommand(): TelegramBot.BotCommand {
		return {
			command: this.command,
			description: this.description,
		};
	}

	get usageString(): string {
		return [
			"/" + this.command,
			this.args.map(a => `<${a.toUpperCase()}>`)
		].join(" ");
	}
}