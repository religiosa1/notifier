import type { Actions, PageServerLoad } from './$types';
import { handleActionFailure, unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';
import { serverUrl } from '~/helpers/serverUrl';

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
		try {
			await fetch(serverUrl("/channels"), {
				method: "POST",
				body: JSON.stringify({ name })
			}).then(unwrapResult);
		} catch(e) {
			return handleActionFailure(e);
		}
	},
}