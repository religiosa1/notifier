if (!("withResolvers" in Promise) || typeof Promise.withResolvers !== "function") {
	Promise.withResolvers = function withResolvers<T>() {
		let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    return { resolve, reject, promise };
	}
}