import type { Actions, PageServerLoad } from "./$types";
import { getFormData } from "~/helpers/getFormData";
import { unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { settingsFormDataSchema, type ServerConfig, type SettingsFormData } from "@shared/models";
import { generateJwtSecret } from "~/helpers/generateJwtSecret";

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
	default: async ({ request, fetch, url }) => {
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
			settings: serverSettings
		};
	}
}