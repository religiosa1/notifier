if (!("withResolvers" in Promise) || typeof Promise.withResolvers !== "function") {
	Promise.withResolvers = function withResolvers<T>() {
		let resolve!: (value: T | PromiseLike<T>) => void;
		let reject!: (reason: unknown) => void;
		const promise = new Promise<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { resolve, reject, promise };
	}
}
