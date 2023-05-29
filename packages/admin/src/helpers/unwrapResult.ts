import { fail, type ActionFailure, error } from "@sveltejs/kit";
import { ZodError, type ZodIssue } from "zod";
import type { Result, ResultFailure } from '~/models/Result';
import { isResultErrorLike } from '~/models/Result';

export function handleLoadError(err: unknown): never {
  throw error(getStatusCode(err), isServerErrorLike(err) ? err.toJson() : JSON.stringify(err));
}

// TODO return a tuple from all unwraps and fail the action

export class ServerError extends Error {
  name = "Server request error" as const;
  error: string;
  message: string;
  statusCode: number;
  toJson() {
    return JSON.parse(JSON.stringify(this));
  }
  constructor(data: ResultFailure) {
    super(`Server request error ${data.statusCode} ${data.error}`);
    this.message = data.message || "Unknown error";
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

export function isServerErrorLike(e: unknown): e is ServerError {
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

// TODO combine with server ResultError
export function errorToResponse(e: unknown): Response {
  if (isServerErrorLike(e)) {
    return new Response(JSON.stringify(e), {
      status: e.statusCode
    });
  }
  if (e && typeof e === "object") {
    return new Response(JSON.stringify({
      ...e,
      success: false,
    }), {
      status: getStatusCode(e)
    });
  }
  return new Response(JSON.stringify({
    success: false,
    error: "Unexpected error",
    detail: e,
    statusCode: 500,
  }))
}

export type ActionError = { error: "Unexpected error", errorDetails: string };
export type UnwrappedError<T> = ActionFailure<T & ActionError>;
export function unwrapError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): UnwrappedError<T> {
  return fail(getStatusCode(e), {
    ...(additionalData as T),
    error: "Unexpected error" as const,
    errorDetails: e?.toString === Object.prototype.toString
      ? JSON.stringify(e)
      : String(e)
  });
}

export type ActionServerError = {
  error: "Server request error";
  errorDetails: string;
}
export type UnwrappedServerError<T> = ActionFailure<T & ActionServerError>;
export function unwrapServerError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T,
): UnwrappedServerError<T> | UnwrappedError<T> {
  if (isServerErrorLike(e)) {
    return fail(e.statusCode || 500, {
      ...(additionalData as T),
      error: "Server request error",
      errorDetails: e.message,
    });
  }
  return unwrapError(e, additionalData);
}

export type ActionValidationError = {
  error: "Validation error";
  errorDetails: {
    fields: Record<string, ZodIssue>,
    unknownErrors: ZodIssue[],
    allErrors: ZodIssue[]
  }
};
export type UnwrappedValidationError<T> = ActionFailure<T & ActionValidationError>;
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