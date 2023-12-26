import { base } from "$app/paths";
import type { HandleFetch } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { server_base } from "./constants";
import { uri } from "./helpers/uri";
import { serverUrl } from "~/helpers/serverUrl";

export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	if (request.url.startsWith(server_base)) {
		request.headers.set('Authorization', event.cookies.get('Authorization') || "");
		request.headers.set('Content-Type', 'application/json');
	}
	return fetch(request).then(r => {
		// We don't intercept settings requests with redirects
		if (request.url.includes(serverUrl("/settings").toString())) {
			return r;
		}
		// Special status code for uninitialized server
		if (r.status === 550) {
			// TODO reset global_hasValidServerSettings if this happened
			redirect(303, base + '/setup');
		}
		if (event.url.pathname !== "/login" && r.status === 403 || r.status === 401) {
			event.cookies.delete("Authorization", { path: "/"});
			redirect(303, base + uri`/login?referer=${event.url.pathname}`);
		}
		return r;
	});
};
