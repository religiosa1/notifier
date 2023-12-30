import { getStatusPhrase, StatusCodes } from "../StatusCodes";
import { z } from "zod";
import { hasProperty } from "../../helpers/hasProperty";

export const resultFailureSchema = z.object({
	success: z.literal(false),
	error: z.string(),
	statusCode: z.number().int().gte(400).lt(600),
	message: z.string(),
	details: z.unknown().optional(),
	ts: z.number().int(),
});

export type ResultFaliure = z.infer<typeof resultFailureSchema>;

interface ResultErrorOptions {
	cause?: unknown;
}
export class ResultError extends Error implements ResultFaliure {
	override name = "ResultError";
	readonly success = false;
	error: string = StatusCodes[500];
	statusCode = 500;
	details?: unknown;
	ts = Date.now();

	constructor(statusCode?: number, message?: string, { cause }: ResultErrorOptions = {}) {
		super(message);
		if (statusCode) {
			this.statusCode = statusCode;
			this.error = getStatusPhrase(statusCode, StatusCodes[500]);
		}
		if (message) {
			this.message = message;
		}
		if (cause != null) {
			this.details = cause;
		}
	}

	toJson(): string{
		return JSON.stringify({ 
			success: false, 
			statusCode: this.statusCode,
			error: this.error,
			message: this.message,
			details: this.details,
			ts: this.ts,
		} satisfies ResultFaliure);
	}

	static from(err: unknown): ResultError{
		const e = new ResultError();
		if (isResultErrorLike(err)) {
			Object.assign(e, err);
			// need to do that separately, as it comes from the proto
			e.message = err.message;
			if ("cause" in err) {
				e.details = err.cause;
			} 
		} else if (err instanceof Error) {
			e.error = err.name;
			e.message = err.message;
			e.details = "cause" in err ? err.cause : undefined;
			if ("statusCode" in err && typeof err.statusCode === "number") {
				e.statusCode = err.statusCode;
			}
		} else if (err && typeof err === "object") {
			if ("statusCode" in err && typeof err.statusCode === "number" && Number.isInteger(err.statusCode)) {
				e.statusCode = err.statusCode;
				e.error = getStatusPhrase(err.statusCode, StatusCodes[500]);
			}
			if ("error" in err && typeof err.error === "string") {
				e.error = err.error;
			}
			if ("message" in err && typeof err.message === "string") {
				e.message = err.message;
			}
			e.details = err;
		} else if (typeof err === "string") {
			e.message = err;
		}
		return e;
	}
}

export function isResultErrorLike(t: unknown): t is ResultFaliure {
	if (!hasProperty(t, "success") || t.success !== false) {
		return false;
	}
	if (!hasProperty(t, "ts", "number")) {
		return false;
	}	
	if (
		!hasProperty(t, "error", "string")
		|| !hasProperty(t, "statusCode", "number")
		|| !hasProperty(t, "message", "string")
	) {
		return false;
	}	
	return true;
}