import type { Actions, PageServerLoad } from "./$types";
import { serverUrl } from "~/helpers/serverUrl";
import { handleActionFailure, handleLoadError, unwrapResult } from "~/helpers/unwrapResult";
import { paginate, getPaginationParams } from "~/helpers/pagination";
import type { Group } from "@shared/models/Group";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from "~/actions/batchDelete";

export const load: PageServerLoad = async ({ fetch, url }) => {
	const pagination = getPaginationParams(url);
	const groups = await fetch(serverUrl(paginate(pagination, "/groups")))
		.then(unwrapResult<Counted<Array<Group & { channelsCount: number; usersCount: number }>>>)
		.catch(handleLoadError);

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
		try {
			fetch(serverUrl("/groups"), {
				method: "POST",
				body: JSON.stringify({ name }),
			})
		} catch(err) {
			handleActionFailure(err);
		}
	},
}