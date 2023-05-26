import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';
import type { UserWithGroups } from '@shared/models/User';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const users = await fetch(new URL(paginate(pagination, '/auth-request'), server_base))
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
	decline: addVerb(batchDelete({ route: "/auth-request" }), "declined"),
	accept: addVerb(batchDelete({ route: "/auth-request", method: "PUT" }), "accepted"),
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