import type { RequestHandler } from "./$types";
import { ResultError } from "@shared/models";
import { unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";

export const GET: RequestHandler = async ({ fetch, url }) => {
	try {
		const groups = await fetch(serverUrl('/settings')).then(unwrapResult);
		return new Response(JSON.stringify(groups, undefined, 4));
	}	catch(err) {
		const outError = ResultError.from(err);
		return new Response(JSON.stringify(err), {
			status: outError.statusCode
		});
	}
};