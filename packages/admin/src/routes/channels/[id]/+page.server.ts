import type { Actions, PageServerLoad } from './$types';
import { handleLoadError, unwrapResult, handleActionFailure } from '~/helpers/unwrapResult';
import type { ChannelDetail } from "@shared/models/Channel";
import { uri } from "~/helpers/uri";
import { batchDelete } from '~/actions/batchDelete';
import { serverUrl } from '~/helpers/serverUrl';
import type { Group } from '@shared/models/Group';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [channel, groups] = await Promise.all([
		fetch(serverUrl(uri`/channels/${params.id}`)).then(unwrapResult<ChannelDetail>),
		fetch(serverUrl('/groups/search')).then(unwrapResult<Group[]>),
	]).catch(handleLoadError);

	return {
		channel,
		groups
	};
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(serverUrl(uri`/channels/${params.id}`), {
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
			await fetch(serverUrl(uri`/channels/${params.id}/groups`), {
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
			await fetch(serverUrl(uri`/channels/${params.id}/groups`), {
				method: "PUT",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		}
		catch(err) {
			return handleActionFailure(err);
		}
	},
}