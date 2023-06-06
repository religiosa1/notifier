import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { passwordSchema, userUpdateSchema, type UserDetail } from "@shared/models/User";
import { handleActionFailure, handleLoadError, unwrapResult, unwrapValidationError } from "~/helpers/unwrapResult";
import { uri } from "~/helpers/uri";
import { getFormData } from "~/helpers/getFormData";
import { serverUrl } from "~/helpers/serverUrl";
import type { Group } from "@shared/models/Group";

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [user, groups] = await Promise.all([
		 fetch(serverUrl(uri`/users/${params.id}`)).then(unwrapResult<UserDetail>),
		 fetch(serverUrl(uri`/groups/search?user=${params.id}`)).then(unwrapResult<Group[]>),
	]).catch(handleLoadError);

	return {
		user,
		groups,
	};
};

export const actions: Actions = {
	async edit({ fetch, request, params }) {
		const formData = await request.formData();
		try {
			var data = getFormData(formData, userUpdateSchema, {
				password: () => undefined,
			});
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}
		try {
			const serverData = (await fetch(serverUrl(uri`/users/${params.id}`), {
				method: "PUT",
				body: JSON.stringify(data),
			}).then(unwrapResult)) as UserDetail;
			return {
				user: serverData
			}
		} catch (err) {
			console.error("User update error", err);
			return handleActionFailure(err, data!);
		}
	},
	async resetPassword({ fetch, request, params }) {
		const formData = await request.formData();
		try {
			var password = passwordSchema.parse(formData.get("password") || null, { path: ["password"]});
		} catch (e) {
			return unwrapValidationError(e, Object.fromEntries(formData));
		}
		try {
			const serverData = (await fetch(serverUrl(uri`/users/${params.id}`), {
				method: "POST",
				body: JSON.stringify({ password }),
			}).then(unwrapResult)) as UserDetail;
			return {
				user: serverData
			}
		} catch (err) {
			console.error("User update error", err);
			return handleActionFailure(err);
		}
	},
	// TODO change all the unwrapped error values for scoping
	async addOrCreateGroup({ fetch, request, params }) {
		const formData = await request.formData();
		const name = formData.get("name");
		try {
			const serverData = await fetch(serverUrl(uri`/users/${params.id}/groups`), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
			return {
				groups: serverData
			};
		} catch (err) {
			console.error("Create group error", err);
			return handleActionFailure(err);
		}
	},
	async deleteAllGroups({ fetch, params }) {
		try {
			const result = await fetch(serverUrl(uri`/users/${params.id}/groups`), {
				method: "DELETE",
			}).then(unwrapResult);
			return {
				groups: result
			};
		} catch (err) {
			console.error("Delete all error", err);
			return handleActionFailure(err);
		}
	},
	async deleteGroup({ fetch, params, request }) {
		const formData = await request.formData();
		const id = formData.get("id");
		if (!id || typeof id !== "string") {
			return fail(422);
		}
		try {
			const result = await fetch(serverUrl(uri`/users/${params.id}/groups/${id}`), {
				method: "DELETE",
			}).then(unwrapResult);
			return {
				groups: result
			};
		} catch (err) {
			console.error("Delete group error", err);
			return handleActionFailure(err);
		}
	},
}