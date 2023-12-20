import { ResultError } from "./ResultError";
import type { ResultSuccess } from "./ResultSuccess";

export type Result<T> = ResultSuccess<T> | ResultError;

export function result<T>(data: T): T extends Error ? ResultError : ResultSuccess<T>;
export function result<T>(data: T, error: true): ResultError;
export function result<T>(data: T, error = false): Result<T> {
  if (error || data instanceof Error) {
    return ResultError.from(data);
  }
  return {
    success: true as const,
    data,
    ts: Date.now(),
  };
}