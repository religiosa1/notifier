import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { UserDetail } from "@shared/models/User";
import type { Counted } from "@shared/models/Counted";
import type { ApiKeyPreview } from "@shared/models/ApiKey";
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import { uri } from '~/helpers/uri';
import { serverUrl } from '~/helpers/serverUrl';
import { serverAction } from "~/actions/serverAction";

export const load: PageServerLoad = async ({ fetch, url, params}) => {
	const pagination = getPaginationParams(url);

	const [ user, keys ] = await Promise.all([
		fetch(serverUrl(uri`/users/${params.id}`))
			.then(unwrapResult) as Promise<UserDetail>,
		fetch(serverUrl(paginate(pagination, uri`/users/${params.id}/api-keys`)))
			.then(unwrapResult) as Promise<Counted<ApiKeyPreview[]>>,
	]);

	return {
		user,
		keys: keys.data,
		pagination: {
			...pagination,
			count: keys.count
		}
	}
};

export const actions: Actions = {
	delete: async ({params, fetch, request}) => {
		const formData = await request.formData();
		const userId = params.id;
		const prefix = formData.get("prefix");
		if (!prefix || typeof prefix !== "string") {
			return fail(422, { error: "Prefix field must be present" });
		}
		const [resposnse, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${userId}/api-keys/${prefix}`), {
				method: "DELETE",
				body: JSON.stringify({}),
			}).then(unwrapResult<UserDetail>);
		});
		return error ?? resposnse;
	},
	deleteAll: async ({ params, fetch}) => {
		const userId = params.id;
		const [resposnse, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${userId}/api-keys`), {
				method: "DELETE",
				body: JSON.stringify({}),
			}).then(unwrapResult<UserDetail>);
		});
		return error ?? resposnse;
	},
	add: async ({ params, fetch }) => {
		const userId = params.id;
		const [resposnse, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${userId}/api-keys`), {
				method: "POST",
				body: JSON.stringify({}),
			}).then(unwrapResult<UserDetail>);
		});
		return error ?? resposnse;
	}
}