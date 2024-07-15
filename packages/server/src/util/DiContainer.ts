import { AsyncLocalStorage } from "async_hooks";

type ContainerInit<T> = {
	[K in keyof T]: () => T[K];
}

export class DiContainer<T extends Record<string, {}>> implements AsyncDisposable {
	private readonly container: Partial<T> = {};

	constructor(
		private readonly containerInit: ContainerInit<T>, 
		private asyncStorage = new AsyncLocalStorage<DiContainer<T>>()
	) {
		this.inject = this.inject.bind(this);
	}

	inject<TItem extends keyof T & string>(key: TItem): T[TItem] {
		const self = this.asyncStorage.getStore() ?? this;
		if (!(key in self.containerInit)) {
			throw new Error(`Incorrect injection key during inject: '${key}'`);
		}
		self.container[key] ??= self.containerInit[key]();
		return self.container[key] as T[TItem] ;
	}

	clone(): DiContainer<T> {
		return new DiContainer(this.containerInit, this.asyncStorage);
	}

	run<K>(cb: () => K | Promise<K>): K | Promise<K> {
		return this.asyncStorage.run(this, cb);
	}

	async close(): Promise<void> {
		const results = await Promise.allSettled(
			Object.values(this.container)
				.filter( dependency => (
					(Symbol.asyncDispose in dependency && typeof dependency[Symbol.asyncDispose] === "function"))
					|| (Symbol.dispose in dependency && typeof dependency[Symbol.dispose] === "function")
				)
				.map((dependecy) => {
					const func = typeof dependecy[Symbol.asyncDispose] === "function" ? dependecy[Symbol.asyncDispose] : dependecy[Symbol.dispose];
					return func();
				})
		);
		const failedResults = results.filter(r => r.status === "rejected");
		if (failedResults.length) {
			throw new Error("Errors occured while closing DiContainer dependecies", { cause: failedResults });
		}
	}

	[Symbol.asyncDispose]() {
		return this.close();
	}
}