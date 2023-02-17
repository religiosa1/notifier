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

type Unwrapped<T, K> = ActionFailure<T & { error: string, errorDetails: unknown } & K>;

type UnwrappedErrorReturn<T> = Unwrapped<T, { name: "Unexpected error"}>;
export function unwrapError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): UnwrappedErrorReturn<T> {
  return fail(getStatusCode(e), {
    ...(additionalData as T),
    name: "Unexpected error" as const,
    error: String(e),
    errorDetails: JSON.parse(JSON.stringify(e ?? null)),
  });
}

type UnwrappedServerErrorReturn<T> = Unwrapped<T, { name: "Server request error" }>;
export function unwrapServerError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): UnwrappedServerErrorReturn<T> | UnwrappedErrorReturn<T> {
  if (isServerErrorLike(e)) {
    return fail(e.statusCode || 500, {
      ...(additionalData as T),
      name: "Server request error" as const,
      error: e.detail ?? e.message,
      errorDetails: JSON.parse(JSON.stringify(e)),
    });
  }
  return unwrapError(e, additionalData);
}

type UnwrappedValidationErrorReturn<T> = Unwrapped<T, {
  name: "Validation error";
  errorDetails: Record<string, ZodIssue>;
}>;
export function unwrapValidationError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): UnwrappedValidationErrorReturn<T> | UnwrappedErrorReturn<T> {
  if (e instanceof ZodError) {
    return fail( 422, {
      ...(additionalData as T),
      name: "Validation error" as const,
      error: e.name,
      errorDetails: Object.fromEntries(e.errors.map(i => [
        i.path, i
      ]))
    });
  }
  return unwrapError(e, additionalData);
}