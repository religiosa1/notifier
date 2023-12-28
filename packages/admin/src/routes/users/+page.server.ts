import type { Actions, PageServerLoad } from './$types';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { UserWithGroups } from "@shared/models/User";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';
import { serverUrl } from '~/helpers/serverUrl';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const users = await fetch(serverUrl(paginate(pagination, '/users')))
		.then(unwrapResult<Counted<UserWithGroups[]>>);

	return {
		users: users.data,
		pagination: {
			...pagination,
			count: users.count
		}
	}
};

export const actions: Actions = {
	delete: batchDelete({ route: "/users" }),
}