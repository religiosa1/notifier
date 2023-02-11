import { getStatusPhrase, StatusCodes } from "../StatusCodes";
import { z } from "zod";

export const resultFailureSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  statusCode: z.number().int().gte(400),
  message: z.string().optional(),
});

export type ResultFaliure = z.infer<typeof resultFailureSchema>;

export class ResultError extends Error implements ResultFaliure {
  success = false as const;
  error: string = StatusCodes[500];
  statusCode = 500;
  message: string = "";

  constructor(statusCode?: number, message?: string) {
    super(message);
    if (message) {
      this.message = message;
    }
    if (statusCode) {
      this.statusCode = statusCode;
      this.error = getStatusPhrase(statusCode, StatusCodes[500]);
    }
  }

  static from(err: unknown): ResultError{
    const e = new ResultError();
    if (err instanceof Error) {
      e.error = err.name;
      e.message = err.message;
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
    }
    return e;
  }
}
