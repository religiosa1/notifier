export function assert<T>(value: T, message = "Null assertion failed"): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error(message);
  }
}