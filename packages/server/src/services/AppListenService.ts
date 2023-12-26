import { di } from "src/injection";

interface ListenInfo {
	address: string;
	port: number;
}

export class AppListenService {
	listen: (info: ListenInfo) => void;
	#prms: Promise<void>;

	constructor(logger = di.inject("logger")) {
		const defer = Promise.withResolvers<void>();
		this.listen = (info: ListenInfo) => {
			logger.info(`App is listening on http://${info.address}:${info.port}/`);
			defer.resolve();
		};
		this.#prms = defer.promise;
	}

	async listening(): Promise<void> {
		return this.#prms;
	}
}