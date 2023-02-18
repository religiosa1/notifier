import { decodeJWT } from "~/helpers/decodeJWT";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
	const auth = cookies.get("Authorization");
	if (!auth) {
		return {};
	}
	const tokenPayload = decodeJWT(auth);
	return {
		user: tokenPayload
	};
}