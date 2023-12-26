import { logger as honoLogger } from "hono/logger"
import { di } from "src/injection";

/// FIXME pino requires formatting string
export const logger = honoLogger((...args) => {
	const loggingSErvice = di.inject("logger");
	loggingSErvice.debug(...args);
});