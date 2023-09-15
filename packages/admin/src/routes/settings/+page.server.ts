import type { Actions, PageServerLoad } from "./$types";
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { getFormData } from "~/helpers/getFormData";
import z from "zod";
import { randomBytes } from "crypto";
import { unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { redirect } from "@sveltejs/kit";

const settingsFormDataSchema = serverConfigSchema.extend({
	apiUrl: z.string().url()
});
type SettingsFormData = z.infer<typeof settingsFormDataSchema>;


export const load: PageServerLoad = async ({ fetch }) => {
	const serverSettings = await fetch(serverUrl("/settings")).then(unwrapResult<ServerConfig>).catch(() => undefined);
	const settings: Partial<SettingsFormData> = {
		apiUrl: "http://127.0.0.1:8085/",
		jwtSecret: randomBytes(256).toString("base64"),
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
		if (url.searchParams.has('initialSetup')) {
			throw redirect(303, "/login");
		}

		return {
			success: true,
			settings: serverSettings
		};
	}
}