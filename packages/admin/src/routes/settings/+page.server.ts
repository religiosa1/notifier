import type { Actions, PageServerLoad } from "./$types";
import { getFormData } from "~/helpers/getFormData";
import { unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { serverConfigSchema, type ServerConfig } from "@shared/models";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ fetch }) => {
	const settings = await fetch(serverUrl("/settings"))
		.then(unwrapResult<ServerConfig>);

	return {
		settings,
	}
}

export const actions: Actions = {
	save: async ({ request, fetch }) => {
		const formData = await request.formData();
		try {
			const data = getFormData(formData, serverConfigSchema);
			var serverSettings = await fetch(serverUrl("/settings"), {
				method: "PUT",
				body: JSON.stringify(data),
			}).then(unwrapResult<ServerConfig>);
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}

		return {
			success: true,
			settings: serverSettings,
		};
	},
	testDbConfiguration: async({request, fetch}) => {
		const formData = await request.formData();
		const databaseUrl = formData.get("databaseUrl");
		var isDbOk = await fetch(serverUrl("/settings/test-database-configuration"), {
			method: "POST",
			body: JSON.stringify({ databaseUrl }),
		}).then(unwrapResult<ServerConfig>);
		if (!isDbOk) {
			return fail(400, { ...Object.fromEntries(formData), isDatabaseUrlOk: false })
		}
		const retobj = {
			...Object.fromEntries(formData),
			isDatabaseUrlOk: true,
		};
		return retobj
	},
}