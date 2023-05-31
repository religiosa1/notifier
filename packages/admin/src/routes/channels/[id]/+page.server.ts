import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { handleLoadError, unwrapResult, handleActionFailure } from '~/helpers/unwrapResult';
import type { ChannelDetail } from "@shared/models/Channel";
import { uri } from "~/helpers/uri";
import { batchDelete } from '~/actions/batchDelete';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const channel = await fetch(new URL(uri`/channels/${params.id}`, server_base))
		.then(unwrapResult<ChannelDetail>)
		.catch(handleLoadError);

	return {
		channel
	};
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(new URL(uri`/channels/${params.id}`, server_base), {
				method: "POST",
				body: JSON.stringify({ name })
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err, { name });
		}
	},
	disconnectGroups: batchDelete(({ params }) => ({ route: uri`/channels/${params.id}/groups` })),
	disconnectAllGroups: async ({ params, fetch }) => {
		try {
			await fetch(new URL(uri`/channels/${params.id}/groups`, server_base), {
				method: "DELETE",
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err);
		}
	},
	addOrCreateGroup: async ({ params, fetch, request }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(new URL(uri`/channels/${params.id}/groups`, server_base), {
				method: "PUT",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		}
		catch(err) {
			return handleActionFailure(err);
		}
	},
}