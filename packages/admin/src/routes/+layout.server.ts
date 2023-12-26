import { decodeJWT } from "~/helpers/decodeJWT";
import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { uri } from "~/helpers/uri";
import { serverUrl } from "~/helpers/serverUrl";
import { base } from "$app/paths";

// TODO also drop the status in fetch hooks, move it to service
let global_hasValidServerSettings = false;

export const load: LayoutServerLoad = async ({ cookies, url, fetch }) => {
	const auth = cookies.get("Authorization");

	if (!global_hasValidServerSettings) {
		if (url.pathname === base + "/setup") {
			return;
		}
		const settingsResponse = await fetch(serverUrl('/settings'));
		if (settingsResponse.status === 550) {
			redirect(303, base + `/setup`);
		} else if (settingsResponse.ok || settingsResponse.status === 401) {
			// 401 means that the user wasn't unauthorized, but this error can only be thrown
			// if server has been initialized with a config
			global_hasValidServerSettings = true;
		}
	}

	if (!auth) {
		if (url.pathname === base + "/login") {
			return {};
		} else {
			redirect(303, base + uri`/login?referer=${url.pathname}`);
		}
	}
	try {
		const tokenPayload = decodeJWT(auth);
		return { user: tokenPayload };
	} catch {
		cookies.delete("Authorization", { path: "/" });
		redirect(303, base + uri`/login?referer=${url.pathname}`);
	}
}