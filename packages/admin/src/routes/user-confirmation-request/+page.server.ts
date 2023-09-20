import type { Actions, PageServerLoad } from './$types';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';
import type { UserWithGroups } from '@shared/models/User';
import { serverUrl } from '~/helpers/serverUrl';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const users = await fetch(serverUrl(paginate(pagination, '/user-confirmation-request')))
		.then(unwrapResult) as Counted<UserWithGroups[]>;

	return {
		users: users.data,
		pagination: {
			...pagination,
			count: users.count
		}
	}
};

export const actions: Actions = {
	decline: addVerb(batchDelete({ route: "/user-confirmation-request" }), "declined"),
	accept: addVerb(batchDelete({ route: "/user-confirmation-request", method: "PUT" }), "accepted"),
}

function addVerb<
	TArgs extends unknown[],
	TRet,
	TVerb extends string
>(fn: (...args: TArgs)=>TRet, verb: TVerb): (...args: TArgs) => Promise<{ data: TRet, verb: TVerb }> {
	return async (...args: TArgs) => {
		const data = await fn(...args);
		return {
			data,
			verb,
		};
	}
}