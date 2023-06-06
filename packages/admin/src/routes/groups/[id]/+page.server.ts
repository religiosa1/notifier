import type { Actions, PageServerLoad } from './$types';
import { handleLoadError, unwrapResult, handleActionFailure } from '~/helpers/unwrapResult';
import type { GroupDetail } from "@shared/models/Group";
import type { Channel } from '@shared/models/Channel';
import { uri } from "~/helpers/uri";
import { batchDelete } from '~/actions/batchDelete';
import { serverUrl } from '~/helpers/serverUrl';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [group, channels] = await Promise.all([
			fetch(serverUrl(uri`/groups/${params.id}`)).then(unwrapResult<GroupDetail>),
			fetch(serverUrl(uri`/channels/search?group=${params.id}`)).then(unwrapResult<Channel[]>),
	]).catch(handleLoadError);
	return {
		group,
		channels
	};
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(serverUrl(uri`/groups/${params.id}`), {
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
			await fetch(serverUrl(uri`/groups/${params.id}/users`), {
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
			await fetch(serverUrl(uri`/groups/${params.id}/channels`), {
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
			await fetch(serverUrl(uri`/groups/${params.id}/channels`), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err);
		}
	},
}