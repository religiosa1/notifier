import { logger as honoLogger } from "hono/logger"
import { di } from "src/injection";

/// FIXME pino requires formatting string
export const logger = honoLogger((...args) => {
	const loggingService = di.inject("logger");
	loggingService.debug(...args);
});