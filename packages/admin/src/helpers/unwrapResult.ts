import { fail, type ActionFailure } from "@sveltejs/kit";
import type { Result, ResultFailure } from '~/models/Result';
import { isResultErrorLike } from '~/models/Result';

export class ServerError extends Error {
  name = "Server request error";
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

export function unwrapError<T extends Record<string, unknown>>(
  e: unknown,
  additionalData?: T
): ActionFailure<T & { error: string, errorDetails: unknown }> {
  if (isServerErrorLike(e)) {
    return fail(e.statusCode || 500, {
      ...(additionalData as T),
      error: e.detail ?? e.message,
      errorDetails: JSON.parse(JSON.stringify(e)),
    });
  }
  return fail(getStatusCode(e), {
    ...(additionalData as T),
    error: String(e),
    errorDetails: JSON.parse(JSON.stringify(e ?? null)),
  });
}