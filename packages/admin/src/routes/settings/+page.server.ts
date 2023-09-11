import type { Actions, PageServerLoad } from "./$types";
import { serverConfigSchema } from "@shared/models/ServerConfig";
import { getFormData } from "~/helpers/getFormData";
import z from "zod";
import { randomBytes } from "crypto";
import { unwrapValidationError } from "~/helpers/unwrapResult";

const settingsFormDataSchema = serverConfigSchema.extend({
	apiUrl: z.string().url()
});
type SettingsFormData = z.infer<typeof settingsFormDataSchema>;

export const load: PageServerLoad = async ({ fetch }) => {
	// TODO: try getting this data from server
	const settings: Partial<SettingsFormData> = {
		apiUrl: "http://127.0.0.1:8085/",
		jwtSecret: randomBytes(256).toString('base64'),
	};
	return {
		settings
	}
}

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		try {
			const data = getFormData(formData, settingsFormDataSchema);
			console.log("data", data);
			return { success: true };
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}
	}
}