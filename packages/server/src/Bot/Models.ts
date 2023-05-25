import type { Message, SendMessageOptions, Update } from "node-telegram-bot-api";

export interface SendMessageProps extends SendMessageOptions {
	text: string;
};

export interface IBotConstructor {
	new (token: string): IBot;
}

export interface IBot {
	setWebHook(token: string): Promise<void>;
	processUpdate(update: Update): void;
	sendMessage(
		chats: Array<string | number>,
		opts: SendMessageProps
	): Promise<PromiseSettledResult<void | Message>[]>;
}