import { serverUrl } from "~/helpers/serverUrl";
import { unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import type { Actions, PageServerLoad } from "./$types";

import { generateJwtSecret } from "~/helpers/generateJwtSecret";
import { isHttpError, isRedirect, redirect } from "@sveltejs/kit";
import { getFormData } from "~/helpers/getFormData";
import { setupFormSchema, type SetupForm, type ServerConfig } from "@shared/models";
import { base } from "$app/paths";

export const load: PageServerLoad = async ({ fetch }) => {
	// Checking if backend has been initialized, by trying to get settings.
	// The only valid outcome is 550 error response (custom code for uninitialzed backend).
	// Existing settings (aka initialized backend) results in redirect to the /settings page
	await fetch(serverUrl("/settings"))
		.then(unwrapResult<ServerConfig>)
		.then(() => redirect(303, base + "/settings"))
		.catch(err => {
			if (isHttpError(err) && err.status === 550) {
				return;
			}
			throw err;
		});

	const settings: Partial<SetupForm> = {
		jwtSecret: generateJwtSecret(),
	};

	return { settings }
}

export const actions: Actions = {
	save: async ({ request, fetch }) => {
		const formData = await request.formData();
		try {
			const data = getFormData(formData, setupFormSchema);
			await fetch(serverUrl("/settings/setup"), {
				method: "PUT",
				body: JSON.stringify(data),
			}).then(unwrapResult<ServerConfig>);
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}

		// TODO display status of various setup operations, i.e. migration, seeding, bot connection, etc.

		redirect(303, base + "/login?referer=%2F");
	},
	testDbConfiguration: async({request, fetch}) => {
		const formData = await request.formData();
		const databaseUrl = formData.get("databaseUrl");
		var isDbOk = await fetch(serverUrl("/settings/test-database-configuration"), {
			method: "POST",
			body: JSON.stringify({ databaseUrl }),
		}).then(unwrapResult<ServerConfig>);
		if (!isDbOk) {
			return { ...Object.fromEntries(formData), isDatabaseUrlOk: false };
		}
		const data = getFormData(formData, setupFormSchema);
		const retobj = {
			...data,
			isDatabaseUrlOk: true,
		};
		return retobj
	},
}