import { decodeJWT } from "~/helpers/decodeJWT";
import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { uri } from "~/helpers/uri";

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const auth = cookies.get("Authorization");
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
		user: tokenPayload
	};
}