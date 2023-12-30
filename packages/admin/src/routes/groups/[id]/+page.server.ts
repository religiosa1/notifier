import type { Actions, PageServerLoad } from './$types';
import type { GroupDetail } from "@shared/models/Group";
import type { Channel } from '@shared/models/Channel';
import { unwrapResult } from '~/helpers/unwrapResult';
import { uri } from "~/helpers/uri";
import { serverUrl } from '~/helpers/serverUrl';
import { batchDelete } from '~/actions/batchDelete';
import { serverAction } from '~/actions/serverAction';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [ group, users, channels ] = await Promise.all([
			fetch(serverUrl(uri`/groups/${params.id}`)).then(unwrapResult<GroupDetail>),
			fetch(serverUrl(uri`/users/search?group=${params.id}`)).then(unwrapResult<Channel[]>),
			fetch(serverUrl(uri`/channels/search?group=${params.id}`)).then(unwrapResult<Channel[]>),
	]);
	return {
		group,
		users,
		channels
	};
};

export const actions: Actions = {
	edit: async ({ params, request, fetch }) => {
		const [data, error] = await serverAction(async () => {
			const fd = await request.formData();
			const name = fd.get("name");
			return fetch(serverUrl(uri`/groups/${params.id}`), {
				method: "PUT",
				body: JSON.stringify({ name })
			}).then(unwrapResult)
		});
		return error ?? data;
	},
	disconnectUsers: batchDelete(({ params }) => ({ route: uri`/groups/${params.id}/users` })),
	disconnectAllUsers: async ({ params, fetch }) => {
		const [data, error] = await serverAction(async () => {
			await fetch(serverUrl(uri`/groups/${params.id}/users`), {
				method: "DELETE",
			}).then(unwrapResult)
		});
		return error ?? data;
	},
	addUser: async ({ params, fetch, request }) => {
		const [data, error] = await serverAction(async () => {
			const fd = await request.formData();
			const name = fd.get("name");
			await fetch(serverUrl(uri`/groups/${params.id}/users`), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		});
		return [error, data];
	},
	disconnectChannels: batchDelete(({ params }) => ({ route: uri`/groups/${params.id}/channels` })),
	disconnectAllChannels: async ({ params, fetch }) => {
		const [data, error] = await serverAction(() => fetch(serverUrl(uri`/groups/${params.id}/channels`), {
			method: "DELETE",
		}).then(unwrapResult));
		return error ?? data;
	},
	addChannel: async ({params, fetch, request}) => {
		const [data, error] = await serverAction(async () => {
			const fd = await request.formData();
			const name = fd.get("name");
			await fetch(serverUrl(uri`/groups/${params.id}/channels`), {
				method: "POST",
				body: JSON.stringify({ name }),
			}).then(unwrapResult);
		});
		return error ?? data;
	},
}