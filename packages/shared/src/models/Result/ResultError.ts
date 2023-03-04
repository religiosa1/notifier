import { getStatusPhrase, StatusCodes } from "../StatusCodes";
import { z } from "zod";

export const resultFailureSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  statusCode: z.number().int().gte(400),
  message: z.string().optional(),
  details: z.unknown().optional(),
});

export type ResultFaliure = z.infer<typeof resultFailureSchema>;

interface ResultErrorOptions {
  cause?: unknown;
}
export class ResultError extends Error implements ResultFaliure {
  success = false as const;
  error: string = StatusCodes[500];
  statusCode = 500;
  details?: unknown;

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

  toJson(){
    return JSON.stringify({ ...this, message: this.message });
  }

  static from(err: unknown): ResultError{
    const e = new ResultError();
    if (err instanceof Error) {
      e.error = err.name;
      e.message = err.message;
      e.details = err;
      if ("statusCode" in err && typeof err.statusCode === "number") {
        e.statusCode = err.statusCode;
      }
    } else if (typeof err === "string") {
      e.message = err;
    } else if (typeof err === "number" && Number.isInteger(err)) {
      e.statusCode = err;
      e.error =  getStatusPhrase(err, StatusCodes[500]);
    } else if (err && typeof err === "object") {
      if ("statusCode" in err && typeof err.statusCode === "number" && Number.isInteger(err.statusCode)) {
        e.statusCode = err.statusCode;
        e.error =  getStatusPhrase(err.statusCode, StatusCodes[500]);
      }
      if ("error" in err && typeof err.error === "string") {
        e.error = err.error;
      }
      if ("message" in err && typeof err.message === "string") {
        e.message = err.message;
      }
      e.details = err;
    }
    return e;
  }
}
