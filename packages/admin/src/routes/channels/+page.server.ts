import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { handleActionFailure, handleLoadError, unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const channels = await fetch(new URL(paginate(pagination, '/channels'), server_base))
		.then(unwrapResult<Counted<Array<Channel & { usersCount: number; groupsCount: number }>>>)
		.catch(handleLoadError);

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
			await fetch(new URL("/channels", server_base), {
				method: "POST",
				body: JSON.stringify({ name })
			}).then(unwrapResult);
		} catch(e) {
			return handleActionFailure(e);
		}
	},
}