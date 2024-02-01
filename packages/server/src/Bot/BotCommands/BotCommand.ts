import type TelegramBot from "node-telegram-bot-api";
import type { BotCommandContext } from "src/Bot/BotCommands/BotCommandContext";
import { esc } from "src/util/esc";
import { reEscape } from "src/util/reEscape";
import { BotCommandError } from "src/Bot/BotCommands/BotErrors";

const wordRegEx = /^[a-zA-Z][\w_]*$/;

type MessageHandler = (
	context: BotCommandContext,
	args: string[],
) => void | Promise<void>;

export class BotCommand {
	public hidden = false;
	public noAuth = false;
	
	get pattern(): RegExp {
		// Using repeat here, so all of the args are correctly packed into their own capture group
		const argsRe = "(?:\\s+([0-9\\w]+))?".repeat(this.args.length);
		const garbageRe = "(?:\\s+.*)?";
		return new RegExp("^\\/" + reEscape(this.command) + argsRe + garbageRe +"$");
	}

	get usageString(): string {
		return [
			"/" + this.command,
			...this.args.map(a => `<${a.toUpperCase()}>`)
		].join(" ");
	}

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

	extractArgs(match: RegExpMatchArray | null): string[] {
		if (match == null) {
			throw new Error("Unexpected empty match object in command");
		}
		const retval: string[] = [];
		for (let i = 0; i < this.args.length; i++) {
			const arg = match?.[i+1];
			if (!arg) {
				throw new BotCommandError(
					`/${this.command} requires you to enter arguments: \n` +
					this.usageString + "\n"
				);
			}
			retval.push(arg);
		}
		return retval;
	}

	toTelegramCommand(): TelegramBot.BotCommand {
		return {
			command: this.command,
			description: this.description,
		};
	}
}
