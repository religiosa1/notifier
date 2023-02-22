import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult, unwrapServerError } from '~/helpers/unwrapResult';
import { paginate, getPaginationParams } from '~/helpers/pagination';
import type { Group } from "@shared/models/Group";
import type { Counted } from "@shared/models/Counted";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { uri } from '~/helpers/uri';

export const load: PageServerLoad = async ({ fetch, url }) => {
  const pagination = getPaginationParams(url);
  const groups = await fetch(new URL(paginate(pagination, '/groups'), server_base))
    .then(unwrapResult) as Counted<Group[]>;

  return {
    groups: groups.data,
    pagination: {
      ...pagination,
      count: groups.count
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
        new URL(uri`/groups?id=${data}`, server_base), {
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