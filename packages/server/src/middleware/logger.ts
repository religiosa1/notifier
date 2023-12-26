import { logger as honoLogger } from "hono/logger"
import { di } from "src/injection";

export const logger = honoLogger((...args) => {
	const loggingSErvice = di.inject("logger");
	loggingSErvice.info(...args);
});