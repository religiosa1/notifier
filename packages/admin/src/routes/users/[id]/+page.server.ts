import type { PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult } from '~/helpers/unwrapResult';
import { uri } from '~/helpers/uri';
import type { UserDetail } from "~/models/User";

export const load: PageServerLoad = async ({ fetch, params }) => {
  const user = await fetch(new URL(uri`/users/${params.id}/`, server_base))
    .then(unwrapResult) as UserDetail;

  return {
    user
  };
};