import type { Actions, PageServerLoad } from "./$types";
import { base } from "$app/paths";
import { fail, redirect } from "@sveltejs/kit";
import { hasProperty } from "@shared/helpers/hasProperty";
import { unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { serverAction } from "~/actions/serverAction";


export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(307, base + '/');
	}
}

export const actions: Actions = {
	async default({ fetch, request, url, cookies }) {
		const formData = await request.formData();
		const name = formData.get("name");
		const password = formData.get("password");
		const [serverData, error] = await serverAction(() => fetch(serverUrl("/login"), {
				method: "POST",
				body: JSON.stringify({ name, password }),
			}).then(unwrapResult)	
		);
		if (error) {
			return error;
		}
		if (!hasProperty(serverData, "token", "string")) {
			return fail(500, { error: "Bad server response, missing `token` field.", name });
		}
		cookies.set("Authorization", `Bearer ${serverData.token}`, { path: '/' });
		let referer = url.searchParams.get("referer");
		if (referer === "/login") {
			referer = null;
		}
		await redirect(307, referer ? base + referer : "/");
	}
};