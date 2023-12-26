import { ResultError } from "@shared/models/Result";
import type { ZodError } from "zod";

export function validationErrorHook(result: {
	success: boolean;
	data: any;
	error?: ZodError
}) {
	if (!result.success) {
		throw new ResultError(422, "Input validation error", { cause: result.error });
	}
}

export function paramErrorHook(result: {
	success: boolean;
	data: any;
	error?: ZodError
}) {
	if (!result.success) {
		throw new ResultError(404, "Mallformed URL params", { cause: result.error });
	}
}