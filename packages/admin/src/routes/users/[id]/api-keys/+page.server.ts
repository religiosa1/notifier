import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { handleLoadError, unwrapResult, unwrapServerError } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { UserDetail } from "@shared/models/User";
import type { Counted } from "@shared/models/Counted";
import type { ApiKeyPreview } from "@shared/models/ApiKey";
import { uri } from '~/helpers/uri';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, url, params}) => {
	const pagination = getPaginationParams(url);

	const [ user, keys ] = await Promise.all([
		fetch(new URL(uri`/users/${params.id}`, server_base))
			.then(unwrapResult) as Promise<UserDetail>,
		fetch(new URL(paginate(pagination, uri`/users/${params.id}/api-keys`), server_base))
			.then(unwrapResult) as Promise<Counted<ApiKeyPreview[]>>,
	]).catch(handleLoadError);

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
		try {
			const resposnse = (await fetch(new URL(uri`/users/${userId}/api-keys/${prefix}`, server_base), {
				method: "DELETE",
				body: JSON.stringify({}),
			}).then(unwrapResult)) as UserDetail;
			return resposnse;
		} catch (err) {
			return unwrapServerError(err);
		}
	},
	deleteAll: async ({ params, fetch}) => {
		const userId = params.id;
		try {
			const resposnse = (await fetch(new URL(uri`/users/${userId}/api-keys`, server_base), {
				method: "DELETE",
				body: JSON.stringify({}),
			}).then(unwrapResult)) as UserDetail;
			return resposnse;
		} catch (err) {
			return unwrapServerError(err);
		}
	},
	add: async ({ params, fetch }) => {
		const userId = params.id;
		try {
			const resposnse = (await fetch(new URL(uri`/users/${userId}/api-keys`, server_base), {
				method: "PUT",
				body: JSON.stringify({}),
			}).then(unwrapResult)) as UserDetail;
			return resposnse;
		} catch (err) {
			console.error("Adding an API-key error", err);
			return unwrapServerError(err);
		}
	}
}