import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import type { UserDetail } from "@shared/models/User";
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import { uri } from '~/helpers/uri';
import { serverUrl } from '~/helpers/serverUrl';
import { batchDelete } from '~/actions/batchDelete';
import { serverAction } from '~/actions/serverAction';

export const load: PageServerLoad = async ({ fetch, url, params}) => {
	const pagination = getPaginationParams(url);
	const [ user, availableChannels, channels ] = await Promise.all([
		fetch(serverUrl(uri`/users/${params.id}`))
			.then(unwrapResult<UserDetail>),
		fetch(serverUrl(paginate(pagination, uri`/users/${params.id}/channels/available`)))
			.then(unwrapResult<Channel[]>),
		fetch(serverUrl(paginate(pagination, uri`/users/${params.id}/channels`)))
			.then(unwrapResult<Counted<Channel[]>>),
	]);

	return {
		user,
		availableChannels,
		channels: channels.data,
		pagination: {
			...pagination,
			count: channels.count
		}
	}
};

export const actions: Actions = {
	delete: batchDelete(({ params }) => ({ route: uri`/users/${params.id}/channels` })),
	add: async ({ params, fetch, request }) => {
		const formData = await request.formData();
		const userId = params.id;
		const id = formData.get("id");
		if (!id || typeof id !== "string") {
			return fail(422, { error: "id field must be present" });
		}
		const [resposnse, error] = await serverAction(() => {
			return fetch(serverUrl(uri`/users/${userId}/channels`), {
				method: "POST",
				body: JSON.stringify({ id }),
			}).then(unwrapResult<UserDetail>);
		}); 
		return error ?? resposnse;
	},
}