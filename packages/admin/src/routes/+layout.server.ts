import { decodeJWT } from "~/helpers/decodeJWT";
import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { uri } from "~/helpers/uri";
import { serverUrl } from "~/helpers/serverUrl";

let global_hasValidServerSettings = false;

export const load: LayoutServerLoad = async ({ cookies, url, fetch }) => {
	const auth = cookies.get("Authorization");

	if (!global_hasValidServerSettings) {
		if (["/login", "/settings"].includes(url.pathname)) {
			return;
		}
		global_hasValidServerSettings = await fetch(serverUrl('/settings')).then(r => r.ok);
		if (!global_hasValidServerSettings) {
			throw redirect(303, base + `/settings?initialSetup`);
		}
	}

	// That's not a real authorization check, it's more for the convenience.
	// Real authorization check occurs in the fetch calls.
	// see hooks.server.ts
	if (!auth) {
		if (url.pathname === "/login") {
			return {};
		} else {
			throw redirect(303, base + uri`/login?referer=${url.pathname}`);
		}
	}
	const tokenPayload = decodeJWT(auth);
	return {
		user: tokenPayload,
	};
}