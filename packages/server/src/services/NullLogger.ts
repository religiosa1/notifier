import type { BaseLogger, LevelWithSilentOrString } from "pino";

export class NullLogger implements BaseLogger {
	level: LevelWithSilentOrString = "trace";
	fatal(..._args: unknown[]) {}
	error(..._args: unknown[]) {}
	warn(..._args: unknown[]) {}
	info(..._args: unknown[]) {}
	debug(..._args: unknown[]) {}
	trace(..._args: unknown[]) {}
	silent(..._args: unknown[]) {}
}