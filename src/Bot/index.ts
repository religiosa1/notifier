import { Bot as BotProd} from "./Bot";
export type { SendMessageProps, Update } from "./Bot";
import { BotMock } from "./BotMock";

export const Bot = process.env.NODE_ENV === 'production'
  ? BotProd
  : BotMock;
