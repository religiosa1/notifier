import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapServerError, unwrapResult } from '~/helpers/unwrapResult';
import { uri } from '~/helpers/uri';
import type { UserDetail } from "@shared/models/User";

export const load: PageServerLoad = async ({ fetch, params }) => {
  try {
    var user = await fetch(new URL(uri`/users/${params.id}`, server_base))
      .then(unwrapResult) as UserDetail;
  } catch(err) {
    console.error("ERRORED", err);
    return unwrapServerError(err);
  }

  return {
    user
  };
};

export const actions: Actions = {
  async edit({ fetch, request, url, cookies }) {
    // TODO
    // const formData = await request.formData();
    // let serverData;
    // try {
    //   serverData = await fetch(new URL("/login", server_base), {
    //     method: "POST",
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(data),
    //   });
    // } catch(err) {
    //   console.error("ERRORED", err);
    //   return unwrapError(err, data);
    // }
  },
  async resetPassword() {
    return {};
  },
}