import type { Actions } from "./$types";
import { server_base } from "~/constants";
import { unwrapResult, handleActionFailure, unwrapValidationError } from "~/helpers/unwrapResult";
import { uri } from "~/helpers/uri";
import { passwordSchema, userCreateSchema, type UserDetail } from "@shared/models/User";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { getFormData } from "~/helpers/getFormData";
import { groupNameSchema } from "@shared/models/Group";

export const actions: Actions = {
	async create({ request, fetch }) {
		const formData = await request.formData();
		try {
			var data = getFormData(formData, userCreateSchema, {
				password: (i) => i[0]
					? passwordSchema.parse(i[0])
					: null,
				groups: ([groups]) => typeof groups === "string"
					? groups.trim().split(/\s*,?\s+/).map((g) => groupNameSchema.parse(g))
					: undefined
			});
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}
		try {
			var serverData = (await fetch(new URL("/users", server_base), {
				method: "PUT",
				body: JSON.stringify(data),
			}).then(unwrapResult)) as UserDetail;
		} catch (err) {
			console.error("User create error", err);
			return handleActionFailure(err, data!);
		}
		if (new URLSearchParams(request.url).has("addNew")) {
			return {
				createdUser: serverData,
			} as const;
		}
		throw redirect(303, base + uri`/users/${serverData.id}`);
	},
};
