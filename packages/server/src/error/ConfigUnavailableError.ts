import { ResultError } from "@shared/models/Result";

export class ConfigUnavailableError extends ResultError {
	override name: string = "ConfigUnavailable";
	constructor(reason?: unknown) {
		super(550, "Config unavailable on the server. Either it wasn't initialized, or there's an IO error on the server", {
			cause: reason
		});
	}
}