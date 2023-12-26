export class AppListenService {
	listen: () => void;
	#prms: Promise<void>;

	constructor() {
		const defer = Promise.withResolvers<void>();
		this.listen = defer.resolve;
		this.#prms = defer.promise;
	}

	async listening(): Promise<void> {
		return this.#prms;
	}
}