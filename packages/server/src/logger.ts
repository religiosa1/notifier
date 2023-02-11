import pino, { BaseLogger } from "pino";

export let logger: BaseLogger = pino({ level: 'info' });

export function registerLogger(loggerService: BaseLogger ) {
  logger = loggerService;
}