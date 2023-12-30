import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import z from "zod";
import { passwordSchema, userUpdateSchema, type UserDetail } from "@shared/models/User";
import type { Group } from "@shared/models/Group";
import { unwrapResult } from "~/helpers/unwrapResult";
import { uri } from "~/helpers/uri";
import { getFormData } from "~/helpers/getFormData";
import { serverUrl } from "~/helpers/serverUrl";
import { serverAction } from "~/actions/serverAction";

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [user, groups] = await Promise.all([
		 fetch(serverUrl(uri`/users/${params.id}`)).then(unwrapResult<UserDetail>),
		 fetch(serverUrl(uri`/groups/search?user=${params.id}`)).then(unwrapResult<Group[]>),
	]);

	return {
		user,
		groups,
	};
};

export const actions: Actions = {
	async edit({ fetch, request, params }) {
		const formData = await request.formData();
		const [data, validationError] = getFormData(formData, userUpdateSchema, {
			password: () => undefined,
		});
		if (validationError) {
			fail(422, validationError);
		}
		const [serverData, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${params.id}`), {
				method: "PUT",
				body: JSON.stringify(data),
			}).then(unwrapResult<UserDetail>);
		});
		if (error) {
			return error;
		}
		return {
			user: serverData
		}
	},
	async resetPassword({ fetch, request, params }) {
		const formData = await request.formData();
		const [{ password = "" } = {}, validationError] = getFormData(formData, z.object({
			password: passwordSchema
		}));
		if (validationError) {
			return fail(422, validationError);
		}
		const [serverData, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${params.id}`), {
				method: "POST",
				body: JSON.stringify({ password }),
			}).then(unwrapResult<UserDetail>);
		});
		if (error) {
			return error;
		}
		return {
			user: serverData
		}
	},
	async addOrCreateGroup({ fetch, request, params }) {
		const formData = await request.formData();
		const name = formData.get("name");
		const [serverData, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${params.id}/groups`), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		});
		if (error) {
			return error;
		}
		return {
			groups: serverData
		};
	},
	async deleteAllGroups({ fetch, params }) {
		const [result, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${params.id}/groups`), {
				method: "DELETE",
			}).then(unwrapResult);
		});
		if (error) {
			return error;
		}
		return {
			groups: result
		};
	},
	async deleteGroup({ fetch, params, request }) {
		const formData = await request.formData();
		const id = formData.get("id");
		if (!id || typeof id !== "string") {
			return fail(422);
		}
		const [result, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${params.id}/groups/${id}`), {
				method: "DELETE",
			}).then(unwrapResult);
		});
		if (error) {
			return error;
		}
		return {
			groups: result
		};
	},
}