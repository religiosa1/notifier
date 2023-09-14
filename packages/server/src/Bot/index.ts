import type { IBotConstructor } from "src/Bot/Models";
import { Bot as BotProd} from "./Bot";
export type { Update } from "./Bot";
import { BotMock } from "./BotMock";

export const Bot: IBotConstructor = process.env.NODE_ENV === "production"
	? BotProd
	: BotMock

export type Bot = BotProd;