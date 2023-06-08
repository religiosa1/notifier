import type { Actions, PageServerLoad } from './$types';
import { handleLoadError, unwrapResult, handleActionFailure } from '~/helpers/unwrapResult';
import type { GroupDetail } from "@shared/models/Group";
import type { Channel } from '@shared/models/Channel';
import { uri } from "~/helpers/uri";
import { batchDelete } from '~/actions/batchDelete';
import { serverUrl } from '~/helpers/serverUrl';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [group, users, channels] = await Promise.all([
			fetch(serverUrl(uri`/groups/${params.id}`)).then(unwrapResult<GroupDetail>),
			fetch(serverUrl(uri`/users/search?group=${params.id}`)).then(unwrapResult<Channel[]>),
			fetch(serverUrl(uri`/channels/search?group=${params.id}`)).then(unwrapResult<Channel[]>),
	]).catch(handleLoadError);
	return {
		group,
		users,
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
	addUser: async ({ params, fetch, request }) => {
		const fd = await request.formData();
		const name = fd.get("name");
		try {
			await fetch(serverUrl(uri`/groups/${params.id}/users`), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		} catch(err) {
			return handleActionFailure(err);
		}
	},
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