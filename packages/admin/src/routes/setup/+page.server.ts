import type { Actions, PageServerLoad } from "./$types";
import { isHttpError, fail, redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { setupFormSchema, type SetupForm, type ServerConfig } from "@shared/models";

import { serverUrl } from "~/helpers/serverUrl";
import { unwrapResult } from "~/helpers/unwrapResult";
import { generateJwtSecret } from "~/helpers/generateJwtSecret";
import { getFormData } from "~/helpers/getFormData";
import { serverAction } from "~/actions/serverAction";

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
		
		const [data, validationError] = getFormData(formData, setupFormSchema);
		if (validationError) {
			fail(422, validationError);
		}
		await fetch(serverUrl("/settings/setup"), {
			method: "PUT",
			body: JSON.stringify(data),
		}).then(unwrapResult<ServerConfig>);

		// TODO display status of various setup operations, i.e. migration, seeding, bot connection, etc.

		redirect(303, base + "/login?referer=%2F");
	},
	testDbConfiguration: async({request, fetch}) => {
		const formData = await request.formData();
		const databaseUrl = formData.get("databaseUrl");
		const [isDbOk, error] = await serverAction(() => {
			return fetch(serverUrl("/settings/test-database-configuration"), {
				method: "POST",
				body: JSON.stringify({ databaseUrl }),
			}).then(unwrapResult<ServerConfig>)
		});
		if (error) {
			return error;
		}
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