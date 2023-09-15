import { serverUrl } from "~/helpers/serverUrl";
import { unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import type { Actions, PageServerLoad } from "./$types";

import { generateJwtSecret } from "~/helpers/generateJwtSecret";
import { redirect } from "@sveltejs/kit";
import { getFormData } from "~/helpers/getFormData";
import { setupFormSchema, type SetupForm, type ServerConfig } from "@shared/models";

export const load: PageServerLoad = async ({ fetch }) => {
	const serverSettings = await fetch(serverUrl("/settings")).then(unwrapResult<ServerConfig>).catch(() => undefined);
	if (serverSettings) {
		throw redirect(303, "/settings");
	}

	const settings: Partial<SetupForm> = {
		apiUrl: "http://127.0.0.1:8085/",
		jwtSecret: generateJwtSecret(),
	};

	return {
		settings,
		initialSetup: !!serverSettings
	}
}

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		try {
			const data = getFormData(formData, setupFormSchema);
			await fetch(serverUrl("/settings"), {
				method: "PUT",
				body: JSON.stringify(data),
			}).then(unwrapResult<ServerConfig>);
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}

		// TODO display status of various setup operations, i.e. migration, seeding, bot connection, etc.

		throw redirect(303, "/");
	}
}