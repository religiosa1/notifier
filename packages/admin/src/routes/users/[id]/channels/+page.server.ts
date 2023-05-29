import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { UserDetail } from "@shared/models/User";
import type { Channel } from "@shared/models/Channel";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';
import { uri } from '~/helpers/uri';

export const load: PageServerLoad = async ({ fetch, url, params}) => {
  const pagination = getPaginationParams(url);
  const [ user, channels ] = await Promise.all([
    fetch(new URL(uri`/users/${params.id}`, server_base))
      .then(unwrapResult) as Promise<UserDetail>,
    fetch(new URL(paginate(pagination, uri`/users/${params.id}/channels`), server_base))
      .then(unwrapResult) as Promise<Counted<Channel[]>>,
  ]);

  return {
    user,
    channels: channels.data,
    pagination: {
      ...pagination,
      count: channels.count
    }
  }
};

export const actions: Actions = {
  delete: batchDelete(({ params }) => ({ route: uri`/users/${params.id}/channels` })),
}