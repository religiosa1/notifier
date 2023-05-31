import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult, unwrapServerError } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { UserDetail } from "@shared/models/User";
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';
import { uri } from '~/helpers/uri';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, url, params}) => {
  const pagination = getPaginationParams(url);
  const [ user, availableChannels, channels ] = await Promise.all([
    fetch(new URL(uri`/users/${params.id}`, server_base))
      .then(unwrapResult) as Promise<UserDetail>,
    fetch(new URL(paginate(pagination, uri`/users/${params.id}/available-channels`), server_base))
      .then(unwrapResult) as Promise<Channel[]>,
    fetch(new URL(paginate(pagination, uri`/users/${params.id}/channels`), server_base))
      .then(unwrapResult) as Promise<Counted<Channel[]>>,
  ]);

  return {
    user,
    availableChannels,
    channels: channels.data,
    pagination: {
      ...pagination,
      count: channels.count
    }
  }
};

export const actions: Actions = {
  delete: batchDelete(({ params }) => ({ route: uri`/users/${params.id}/channels` })),
  add: async ({ params, fetch, request }) => {
    const formData = await request.formData();
    const userId = params.id;
    const id = formData.get("id");
		if (!id || typeof id !== "string") {
			return fail(422, { error: "id field must be present" });
		}
		try {
			const resposnse = (await fetch(new URL(uri`/users/${userId}/channels`, server_base), {
				method: "POST",
				body: JSON.stringify({ id }),
			}).then(unwrapResult)) as UserDetail;
			return resposnse;
		} catch (err) {
			console.error("Adding an API-key error", err);
			return unwrapServerError(err);
		}
  },
}