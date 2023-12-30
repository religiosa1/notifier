import type { Handle, HandleFetch } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { uri } from "./helpers/uri";
import { serverUrl } from "~/helpers/serverUrl";
import { base } from "$app/paths";
import { sequence } from "@sveltejs/kit/hooks";
import { decodeJWT } from "./helpers/decodeJWT";

let global_hasValidServerSettings = false;

const checkBackendInitialization: Handle = async ({ event, resolve }) => {
	event.locals.isBackendInitialized = global_hasValidServerSettings;
	if (global_hasValidServerSettings || event.url.pathname.startsWith(base + "/setup")) {
		return resolve(event);
	}
	const settingsResponse = await fetch(serverUrl(base + '/settings'))
	if (!settingsResponse || settingsResponse.status === 550) {
		redirect(303, base + `/setup`);
	} else if (
		settingsResponse?.ok 
		|| settingsResponse?.status === 401
		|| settingsResponse?.status === 403
	) {
		// unauthotrized resposne status code can only be thrown if server has been 
		// initialized with a config, so we treat it as a successfull init check too
		global_hasValidServerSettings = true;
	}
	return resolve(event);
};

const checkAuthStatus: Handle = async ({ event, resolve }) => {
	// Not checking auth status on uninitialized backend
	if (!global_hasValidServerSettings) {
		return resolve(event);
	}
	const auth = event.cookies.get("Authorization");

	if (!auth) {
		if (event.url.pathname.startsWith(base + "/login")) {
			return resolve(event);
		}
		redirect(303, base + uri`/login?referer=${event.url.pathname}`);
	}

	try {
		const tokenPayload = decodeJWT(auth);
		event.locals.user = tokenPayload;
	} catch {
		event.cookies.delete("Authorization", { path: "/" });
		if (!event.url.pathname.startsWith(base + "/login")) {
			redirect(303, base + uri`/login?referer=${event.url.pathname}`);
		}
	}

	return resolve(event);
};

export const handle = sequence(
	checkBackendInitialization,
	checkAuthStatus,
);

export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	if (request.url.startsWith(import.meta.env.API_URL)) {
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
			global_hasValidServerSettings = false;
			redirect(303, base + '/setup');
		}
		if (!event.url.pathname.startsWith(base + "/login") && (r.status === 403 || r.status === 401)) {
			event.cookies.delete("Authorization", { path: "/" });
			redirect(303, base + uri`/login?referer=${event.url.pathname}`);
		}
		return r;
	});
};
