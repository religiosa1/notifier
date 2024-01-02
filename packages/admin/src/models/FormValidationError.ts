import { hasProperty } from "@shared/helpers/hasProperty";
import type { typeToFlattenedError } from "zod";

export type FormValidationError<T extends Record<string, unknown>> = {
	success: false,
	details: typeToFlattenedError<T>;
	error: "Validation Error";
}

export function isValidationError(t: unknown): t is FormValidationError<Record<string, unknown>> {
	return hasProperty(t, "details") && hasProperty(t, "error") && t.error === "Validation Error";
}

export function makeValidationError<T extends Record<string, unknown>>(
	error: typeToFlattenedError<T>,
): FormValidationError<T>{
	return {
		success: false,
		error: "Validation Error",
		details: error,
	};
}
