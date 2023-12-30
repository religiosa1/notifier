import type { RequestHandler } from "./$types";
import { ResultError } from "@shared/models";
import { attempt } from "@shared/helpers/attempt";
import { unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";

export const GET: RequestHandler = async ({ fetch, url }) => {
	const targetUrl = serverUrl('/groups/search');
	const name = url.searchParams.get("name");
	if (name) {
		targetUrl.searchParams.set("name", name)
	}

	const [groups, error] = await attempt(() => fetch(targetUrl).then(unwrapResult));
	if (error != null) {
		const outError = ResultError.from(error);
		return new Response(JSON.stringify(error), {
			status: outError.statusCode
		});
	} 

	return new Response(JSON.stringify(groups));
};