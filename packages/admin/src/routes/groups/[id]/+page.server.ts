import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { handleLoadError, unwrapResult, handleActionFailure } from '~/helpers/unwrapResult';
import type { GroupDetail } from "@shared/models/Group";
import { uri } from "~/helpers/uri";
import { batchDelete } from '~/actions/batchDelete';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const group = await fetch(new URL(uri`/groups/${params.id}`, server_base))
		.then(unwrapResult<GroupDetail>)
		.catch(handleLoadError);

	return {
		group
	};
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(new URL(uri`/groups/${params.id}`, server_base), {
				method: "PUT",
				body: JSON.stringify({ name })
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err, { name });
		}
	},
	disconnectUsers: batchDelete(({ params }) => ({ route: uri`/groups/${params.id}/users` })),
	disconnectAllUsers: async ({ params, fetch }) => {
		try {
			await fetch(new URL(uri`/groups/${params.id}/users`, server_base), {
				method: "DELETE",
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err);
		}
	},
	// TODO connect users
	disconnectChannels: batchDelete(({ params }) => ({ route: uri`/groups/${params.id}/channels` })),
	disconnectAllChannels: async ({ params, fetch }) => {
		try {
			await fetch(new URL(uri`/groups/${params.id}/channels`, server_base), {
				method: "DELETE",
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err);
		}
	},
	addChannel: async ({params, fetch, request}) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(new URL(uri`/groups/${params.id}/channels`, server_base), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err);
		}
	},
}