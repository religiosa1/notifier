import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { UserWithGroups } from "@shared/models/User";
import type { Counted } from "@shared/models/Counted";
import { batchDelete } from '~/actions/batchDelete';

export const load: PageServerLoad = async ({ fetch, url }) => {
  const pagination = getPaginationParams(url);
  const users = await fetch(new URL(paginate(pagination, '/users'), server_base))
    .then(unwrapResult) as Counted<UserWithGroups[]>;

  return {
    users: users.data,
    pagination: {
      ...pagination,
      count: users.count
    }
  }
};

export const actions: Actions = {
  delete: batchDelete({ route: "/users" }),
}