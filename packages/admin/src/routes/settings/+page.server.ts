import type { Actions, PageServerLoad } from "./$types";
import { getFormData } from "~/helpers/getFormData";
import { unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { settingsFormDataSchema, type ServerConfig, type SettingsFormData } from "@shared/models";
import { generateJwtSecret } from "~/helpers/generateJwtSecret";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ fetch }) => {
	const serverSettings = await fetch(serverUrl("/settings")).then(unwrapResult<ServerConfig>).catch(() => undefined);
	const settings: Partial<SettingsFormData> = {
		apiUrl: "http://127.0.0.1:8085/",
		jwtSecret: generateJwtSecret(),
		...serverSettings
	};
	return {
		settings,
		initialSetup: !!serverSettings
	}
}

export const actions: Actions = {
	save: async ({ request, fetch }) => {
		const formData = await request.formData();
		try {
			const data = getFormData(formData, settingsFormDataSchema);
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
		var isDbOk = await fetch(serverUrl("/test-database-configuration"), {
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