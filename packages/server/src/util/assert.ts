export function assert<T>(value: T, message: string | (() => Error) = "Null assertion failed"): asserts value is NonNullable<T> {
  if (value == null) {
    if (typeof message === "function") {
      throw message();
    }
    throw new Error(message);
  }
}
