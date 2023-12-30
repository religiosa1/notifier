import type { Actions, PageServerLoad } from "./$types";
import { redirect, fail } from "@sveltejs/kit";
import { passwordSchema, userCreateSchema, type UserDetail } from "@shared/models/User";
import { groupNameSchema, type Group } from "@shared/models/Group";
import { unwrapResult } from "~/helpers/unwrapResult";
import { uri } from "~/helpers/uri";
import { base } from "$app/paths";
import { getFormData } from "~/helpers/getFormData";
import { serverUrl } from "~/helpers/serverUrl";
import { serverAction } from "~/actions/serverAction";

export const load: PageServerLoad = async ({ fetch }) => {
	const groups = await fetch(serverUrl(uri`/groups/search`))
		.then(unwrapResult<Group[]>);

	return {
		groups,
	};
};

export const actions: Actions = {
	async create({ request, fetch }) {
		const formData = await request.formData();
		const [ data, validationError ] = getFormData(formData, userCreateSchema, {
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
		if (validationError) {
			return fail(422, validationError);
		}
		const [serverData, error] = await serverAction(async () => {
			return await fetch(serverUrl("/users"), {
				method: "POST",
				body: JSON.stringify(data),
			}).then(unwrapResult<UserDetail>);
		});
		if (error) {
			return error;
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
