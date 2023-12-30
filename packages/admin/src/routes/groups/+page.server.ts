import type { Actions, PageServerLoad } from "./$types";
import type { Group } from "@shared/models/Group";
import type { Counted } from "@shared/models/Counted";
import { serverUrl } from "~/helpers/serverUrl";
import { unwrapResult } from "~/helpers/unwrapResult";
import { paginate, getPaginationParams } from "~/helpers/pagination";
import { batchDelete } from "~/actions/batchDelete";
import { serverAction } from "~/actions/serverAction";

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const groups = await fetch(serverUrl(paginate(pagination, "/groups")))
		.then(unwrapResult<Counted<Array<Group & { channelsCount: number; usersCount: number }>>>);

	return {
		groups: groups.data,
		pagination: {
			...pagination,
			count: groups.count
		}
	}
};

export const actions: Actions = {
	delete: batchDelete({ route: "/groups" }),
	add: async ({ request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		const [data, error] = await serverAction(() => fetch(serverUrl("/groups"), {
			method: "POST",
			body: JSON.stringify({ name }),
		}));
		return error ?? data;
	},
}