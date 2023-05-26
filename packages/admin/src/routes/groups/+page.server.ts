import type { Actions, PageServerLoad } from "./$types";
import { server_base } from "~/constants";
import { unwrapResult } from "~/helpers/unwrapResult";
import { paginate, getPaginationParams } from "~/helpers/pagination";
import type { Group } from "@shared/models/Group";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from "~/actions/batchDelete";

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const groups = await fetch(new URL(paginate(pagination, "/groups"), server_base))
		.then(unwrapResult) as Counted<Array<Group & { channelsCount: number; usersCount: number }>>;

	return {
		groups: groups.data,
		pagination: {
			...pagination,
			count: groups.count
		}
	}
};

export const actions: Actions = {
	delete: batchDelete({ route: "/groups" })
}