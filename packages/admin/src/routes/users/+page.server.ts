import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult, unwrapServerError } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { UserWithGroups } from "@shared/models/User";
import type { Counted } from "@shared/models/Counted";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { uri } from '~/helpers/uri';

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
  async delete({ request, fetch }) {
    const formData = await request.formData();
    const data = formData.getAll("id")
      .filter(i => typeof i === "string").join();
    try {
      const serverData = await fetch(
        new URL(uri`/users?id=${data}`, server_base), {
        method: "DELETE",
        body: JSON.stringify(data),
      }).then(unwrapResult) as BatchOperationStats;
      return serverData;
    } catch(err) {
      console.error("ERRORED", err);
      return unwrapServerError(err);
    }
  }
}