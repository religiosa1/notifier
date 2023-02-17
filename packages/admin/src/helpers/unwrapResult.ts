import { fail, type ActionFailure } from "@sveltejs/kit";
import { ZodError, type ZodIssue } from "zod";
import type { Result, ResultFailure } from '~/models/Result';
import { isResultErrorLike } from '~/models/Result';

export class ServerError extends Error {
  name = "Server request error" as const;
  error: string;
  detail?: string;
  statusCode: number;
  constructor(data: ResultFailure) {
    super(`Server request error ${data.statusCode} ${data.error}`);
    this.detail = data.message;
    this.error = data.error;
    this.statusCode = data.statusCode;
  }
}

export function unwrapResult<T>(r: Response): Promise<T> {
  return r.json().then((data: Result<T>) => {
    if (isResultErrorLike(data)) {
      throw new ServerError(data);
    }
    if (!r.ok) {
      throw new Error(`General http error: ${r.status}`);
    }
    return data?.data;
  });
}

function isServerErrorLike(e: unknown): e is ServerError {
  if (!e || typeof e !== "object" || !("name" in e)) {
    return false;
  }
  return e.name === "Server request error";
}
function getStatusCode(e: unknown, fallback = 500): number {
  if (e && typeof e === "object" && "statusCode" in e && typeof e.statusCode === "number" ) {
    return e.statusCode;
  }
  return fallback;
}

type UnwrappedError<T> = ActionFailure<T & { error: "Unexpected error", errorDetails: string }>;
export function unwrapError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): UnwrappedError<T> {
  return fail(getStatusCode(e), {
    ...(additionalData as T),
    error: "Unexpected error" as const,
    errorDetails: String(e)
  });
}

type UnwrappedServerError<T> = ActionFailure<T & {
  error: "Server request error";
  errorDetails: string;
}>;
export function unwrapServerError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): UnwrappedServerError<T> | UnwrappedError<T> {
  if (isServerErrorLike(e)) {
    return fail(e.statusCode || 500, {
      ...(additionalData as T),
      error: "Server request error",
      errorDetails: e.detail ?? e.message,
    });
  }
  return unwrapError(e, additionalData);
}

type UnwrappedValidationError<T> = ActionFailure<T & {
  error: "Validation error";
  errorDetails: {
    fields: Record<string, ZodIssue>,
    unknownErrors: ZodIssue[],
    allErrors: ZodIssue[]
  }
}>;
export function unwrapValidationError<T extends Record<string, unknown>>(
  e: unknown,
  formData?: T,
): UnwrappedValidationError<T> {
  if (e instanceof ZodError) {
    const knownKeys = Object.keys( formData || {});
    const unknownErrors = e.errors.filter(i => !knownKeys.includes(i.path.toString()));
    const fields: Record<string, ZodIssue> = Object.fromEntries(e.errors.map(i => [
      i.path.toString(), i
    ] satisfies [ string, ZodIssue ]));
    return fail( 422, {
      ...(formData as T),
      error: "Validation error" as const,
      errorDetails: {
        fields,
        unknownErrors,
        allErrors: e.errors,
      }
    });
  }
  throw e;
}