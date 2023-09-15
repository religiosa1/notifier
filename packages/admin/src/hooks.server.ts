import { base } from "$app/paths";
import type { HandleFetch } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { server_base } from "./constants";
import { uri } from "./helpers/uri";

export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	if (request.url.startsWith(server_base)) {
		request.headers.set('Authorization', event.cookies.get('Authorization') || "");
		request.headers.set('Content-Type', 'application/json');
	}

	if (event.url.pathname === "/login") {
		return fetch(request);
	}
	return fetch(request).then(r => {
		if (r.status === 403 || r.status === 401) {
			throw redirect(303, base + uri`/login?referer=${event.url.pathname}`);
		}
		return r;
	});
};
