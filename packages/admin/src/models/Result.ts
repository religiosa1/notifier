// TODO FIXME shared types with backend

export interface ResultFailure {
  success?: false;
  error: string;
  statusCode: number;
  message: string;
}

export type Result<T> = {
  success: true;
  data: T
} | ResultFailure

export function isResultErrorLike(item: unknown): item is ResultFailure {
  if (item == null || typeof item !== "object") {
    return false;
  }

  return (
    "error" in item && typeof item.error === "string" &&
    "statusCode" in item && typeof item.statusCode === "number"
  );
}