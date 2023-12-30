import type { Actions, PageServerLoad } from './$types';
import type { Group } from '@shared/models/Group';
import type { ChannelDetail } from "@shared/models/Channel";
import { unwrapResult } from '~/helpers/unwrapResult';
import { uri } from "~/helpers/uri";
import { serverUrl } from '~/helpers/serverUrl';
import { batchDelete } from '~/actions/batchDelete';
import { serverAction } from '~/actions/serverAction';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [channel, groups] = await Promise.all([
		fetch(serverUrl(uri`/channels/${params.id}`)).then(unwrapResult<ChannelDetail>),
		fetch(serverUrl('/groups/search')).then(unwrapResult<Group[]>),
	]);

	return {
		channel,
		groups
	};
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		const [data, error] = await serverAction(() => fetch(serverUrl(uri`/channels/${params.id}`), {
			method: "PUT",
			body: JSON.stringify({ name })
		}).then(unwrapResult));
		return error ?? data;
	},
	disconnectGroups: batchDelete(({ params }) => ({ route: uri`/channels/${params.id}/groups` })),
	disconnectAllGroups: async ({ params, fetch }) => {
		const [data, error] = await serverAction(() => fetch(serverUrl(uri`/channels/${params.id}/groups`), {
			method: "DELETE",
		}).then(unwrapResult));
		return error ?? data;
	},
	addOrCreateGroup: async ({ params, fetch, request }) => {
		const fd = await request.formData();
		const name = fd.get("name");		
		const [data, error] = await serverAction(() => fetch(serverUrl(uri`/channels/${params.id}/groups`), {
			method: "POST",
			body: JSON.stringify({ name }),
		}).then(unwrapResult));
		return error ?? data;
	},
}