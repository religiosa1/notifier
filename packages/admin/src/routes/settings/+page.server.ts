import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { serverConfigSchema, type ServerConfig } from "@shared/models";
import { getFormData } from "~/helpers/getFormData";
import { unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { serverAction } from "~/actions/serverAction";
import { importConfigAction } from "~/actions/importConfigAction";

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
		const [data, validationError] = getFormData(formData, serverConfigSchema);
		if (validationError) {
			return fail(422, validationError);
		}
		const [serverSettings, error] = await serverAction(() => fetch(serverUrl("/settings"), {
			method: "PUT",
			body: JSON.stringify(data),
		}).then(unwrapResult<ServerConfig>));
		if (error) {
			return error;
		}

		return {
			success: true,
			settings: serverSettings,
		};
	},
	testDbConfiguration: async({request, fetch}) => {
		const formData = await request.formData();
		const databaseUrl = formData.get("databaseUrl");
		const [isDbOk, error] = await serverAction(() => fetch(serverUrl("/settings/test-database-configuration"), {
			method: "POST",
			body: JSON.stringify({ databaseUrl }),
		}).then(unwrapResult<ServerConfig>));
		if (error) { 
			return error;
		}
		if (!isDbOk) {
			return fail(400, { ...Object.fromEntries(formData), isDatabaseUrlOk: false })
		}
		const retobj = {
			...Object.fromEntries(formData),
			isDatabaseUrlOk: true,
		};
		return retobj
	},

	import: importConfigAction,
}