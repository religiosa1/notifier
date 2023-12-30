import { hasProperty } from "@shared/helpers/hasProperty";
import type { typeToFlattenedError } from "zod";

export type FormValidationError<T extends Record<string, unknown>> = Record<keyof T, string> & {
	details: typeToFlattenedError<T>;
	error: "Validation Error";
}

export function isValidationError(t: unknown): t is FormValidationError<Record<string, unknown>> {
	return hasProperty(t, "details") && hasProperty(t, "error") && t.error === "Validation Error";
}

