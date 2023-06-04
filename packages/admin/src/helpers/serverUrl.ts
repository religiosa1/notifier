import { urlJoin } from "@shared/helpers/urlJoin";
import { server_base } from "~/constants";

export function serverUrl(url: string | URL): URL {
	try {
		var baseUrl = new URL(server_base);
	}	catch(e) {
		throw new Error(
			"Can't create base server url.\n" +
			"Did you forget to set API_URL environment variable?\n" +
			`Using: ${JSON.stringify(server_base ?? undefined)}`, {
			cause: e
		});
	}
	const u = new URL(url, server_base);
	if (baseUrl.pathname) {
		u.pathname = urlJoin(baseUrl.pathname, u.pathname);
	}

	return u;
}