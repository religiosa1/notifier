import type { Actions, PageServerLoad } from "./$types";
import { unwrapResult, handleActionFailure, unwrapValidationError, handleLoadError } from "~/helpers/unwrapResult";
import { uri } from "~/helpers/uri";
import { passwordSchema, userCreateSchema, type UserDetail } from "@shared/models/User";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { getFormData } from "~/helpers/getFormData";
import { groupNameSchema, type Group } from "@shared/models/Group";
import { serverUrl } from "~/helpers/serverUrl";

export const load: PageServerLoad = async ({ fetch }) => {
	const groups = await fetch(serverUrl(uri`/groups/search`))
		.then(unwrapResult<Group[]>)
		.catch(handleLoadError);

	return {
		groups,
	};
};

export const actions: Actions = {
	async create({ request, fetch }) {
		const formData = await request.formData();
		try {
			var data = getFormData(formData, userCreateSchema, {
				password: (i) => i[0]
					? passwordSchema.parse(i[0], { path: ["password"] })
					: null,
				groups: ([groups]) => typeof groups === "string"
					? groups
						.trim().split(/\s*,?\s+/)
						.filter(Boolean)
						.map((g) => groupNameSchema.parse(g, { path: ["password"] }))
					: undefined
			});
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}
		try {
			var serverData = (await fetch(serverUrl("/users"), {
				method: "POST",
				body: JSON.stringify(data),
			}).then(unwrapResult)) as UserDetail;
		} catch (err) {
			console.error("User create error", err);
			return handleActionFailure(err, data!);
		}
		if (new URLSearchParams(request.url).has("addNew")) {
			return {
				success: true,
				createdUser: serverData,
			} as const;
		}
		redirect(303, base + uri`/users/${serverData.id}`);
	},
};
