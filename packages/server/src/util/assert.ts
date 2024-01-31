export function assert<T>(value: T, message: string | (() => Error) = "Null assertion failed"): asserts value {
	if (!value) {
		if (typeof message === "function") {
			throw message();
		}
		throw new Error(message);
	}
}
