import type { Actions, PageServerLoad } from './$types';
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { unwrapResult } from '~/helpers/unwrapResult';
import { serverUrl } from '~/helpers/serverUrl';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import { batchDelete } from '~/actions/batchDelete';
import { serverAction } from '~/actions/serverAction';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const channels = await fetch(serverUrl(paginate(pagination, '/channels')))
		.then(unwrapResult<Counted<Array<Channel & { usersCount: number; groupsCount: number }>>>);

	return {
		channels: channels.data,
		pagination: {
			...pagination,
			count: channels.count
		}
	}
};

export const actions: Actions = {
	delete: batchDelete({ route: "/channels" }),
	add: async ({ request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		const [data, error] = await serverAction(() => fetch(serverUrl("/channels"), {
			method: "POST",
			body: JSON.stringify({ name })
		}).then(unwrapResult));
		return error ?? data;
	},
}