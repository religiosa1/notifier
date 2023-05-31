import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { handleLoadError, unwrapResult } from '~/helpers/unwrapResult';
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
	edit: () => {},
	disconnectGroups: batchDelete({ route: "/channels" }),
	disconnectAllGroups: () => {},
	addOrCreateGroup: () => {},
}