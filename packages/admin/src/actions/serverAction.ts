import { attempt, type AttemptResult } from "@shared/helpers/attempt";
import { hasProperty } from "@shared/helpers/hasProperty";
import { isResultErrorLike, type ResultFaliure } from "@shared/models";
import { fail, isHttpError, type ActionFailure } from "@sveltejs/kit";
import { isValidationError } from "~/models/FormValidationError";

export async function serverAction<T>(
	handler: () => Promise<T>
): Promise<AttemptResult<Awaited<T>, ActionFailure<ResultFaliure>>> {
	const [data, error] = await attempt(handler);
	if (error == null) {
		return [data, undefined];
	}
	if (isHttpError(error)) {
		const { status, body } = error;
		return [undefined, errorToFailure(body, status)];
	}
	return [data, errorToFailure(error)];

}

function errorToFailure(error: unknown, defaultStatusCode = 500): ActionFailure<ResultFaliure> {
	if (isResultErrorLike(error)) {
		return fail(error.statusCode, error);
	}
	if (isValidationError(error)) {
		return fail(422, {
			success: false,
			statusCode: 422,
			error: error.error,
			message: "Validation Error",
			details: error.details,
			ts: Date.now(),
		});
	}
	const statusCode = hasProperty(error, "statusCode", "number") ? error.statusCode : defaultStatusCode;
	return fail(statusCode, {
		success: false,
		statusCode,
		error: "Unexpected error",
		message: String(error),
		ts: Date.now(),
		// Clearing prototypes and converting error to POJO
		details: JSON.parse(JSON.stringify(error) ?? null),
	});	
}