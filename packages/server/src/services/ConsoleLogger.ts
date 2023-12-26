import type { BaseLogger, pino } from "pino";

/** Mock for pino, instead just loggin as simple as possible into console
 * No merge objects or arguments interpolation is supported.
 */
export class ConsoleLogger implements BaseLogger {
	level: pino.LevelWithSilentOrString = "trace";

	fatal(...args: unknown[]) {
		if (this.level === "silent") {
			return;
		}
		console.error(...args);
	}
	error(...args: unknown[]) {
		if (this.level === "silent" || this.level === "fatal") {
			return;
		}
		console.error(...args);
	}
	warn(...args: unknown[]) {
		if (this.level === "silent" || this.level === "fatal" || this.level === "error") {
			return;
		}
		console.warn(...args);
	}

	info(...args: unknown[]) {
		if (this.level !== "trace" && this.level !== "debug" &&  this.level !== "info") {
			return;
		}
		console.log(...args);
	}

	debug(...args: unknown[]) {
		if (this.level !== "trace" && this.level !== "debug") {
			return;
		}
		console.log(...args);
	}

	trace(...args: unknown[]) {
		if (this.level !== "trace") {
			return;
		}
		console.log(...args);
	}

	silent(..._args: unknown[]) { }
}