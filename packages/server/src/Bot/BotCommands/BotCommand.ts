import type TelegramBot from "node-telegram-bot-api";
import type { BotCommandContext } from "src/Bot/BotCommands/BotCommandContext";
import { esc } from "src/util/esc";
import { reEscape } from "@shared/helpers/reEscape";
import { BotCommandError } from "src/Bot/BotCommands/BotErrors";

const wordRegEx = /^[a-zA-Z][\w_]*$/;

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
		const argsRe = this.args.length
			// Using repeat here, so all of the args are correctly packed into their own capture group
			? "(?:\\s+([0-9\\w]+))?".repeat(this.args.length)
			: "";
		const garbageRe = "(?:\\s+.*)?";
		return new RegExp("^\\/" + reEscape(this.command) + argsRe + garbageRe +"$");
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
					`Command /${this.command} requires specific amount of args: \n` +
					this.usageString + "\n" +
					`expected: ${this.args.length} args, got ${i}`
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

	get usageString(): string {
		return [
			"/" + this.command,
			...this.args.map(a => `<${a.toUpperCase()}>`)
		].join(" ");
	}
}
