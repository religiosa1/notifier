export class AppListenService {
	listen: () => void;
	private _prms: Promise<void>;

	constructor() {
		const defer = Promise.withResolvers<void>();
		this.listen = defer.resolve;
		this._prms = defer.promise;
	}

	async listening(): Promise<void> {
		return this._prms;
	}
}