import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const channels = await fetch(new URL(paginate(pagination, '/channels'), server_base))
		.then(unwrapResult) as Counted<Array<Channel & { usersCount: number; groupsCount: number }>>;

	return {
		channels: channels.data,
		pagination: {
			...pagination,
			count: channels.count
		}
	}
};

export const actions: Actions = {
	delete: batchDelete({ route: "/channels" })
}