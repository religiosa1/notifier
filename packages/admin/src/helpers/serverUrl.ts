import { urlJoin } from "@shared/helpers/urlJoin";
import { attempt } from "@shared/helpers/attempt"; 

export function serverUrl(url: string | URL): URL {
	const [baseUrl, error] = attempt(() => new URL(import.meta.env.API_URL));
	if (error != null) {
		throw new Error(
			"Can't create base server url, API_URL env variable doesn't contain a valid url.\n" +
			"Did you forget to set API_URL environment variable?\n" +
			`Using: ${JSON.stringify(import.meta.env.API_URL)}`, {
			cause: error
		});
	}
	const u = new URL(url, import.meta.env.API_URL);
	if (baseUrl.pathname) {
		u.pathname = urlJoin(baseUrl.pathname, u.pathname);
	}

	return u;
}