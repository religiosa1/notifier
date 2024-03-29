import type { RequestHandler } from "./$types";
import { ResultError } from "@shared/models";
import { unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";

export const GET: RequestHandler = async ({ fetch, url }) => {
	const targetUrl = serverUrl('/groups/search');
	const name = url.searchParams.get("name");
	if (name) {
		targetUrl.searchParams.set("name", name)
	}

	try {
		const groups = await fetch(targetUrl).then(unwrapResult);
		return new Response(JSON.stringify(groups));
	}	catch(err) {
		const outError = ResultError.from(err);
		return new Response(JSON.stringify(err), {
			status: outError.statusCode
		});
	}
};