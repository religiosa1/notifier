import type { PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapResult } from '~/helpers/unwrapResult';
import { paginate } from '~/helpers/pagination';

/** TODO share types and ZOD-schema with backend */
interface UserData {
  name: string | null;
  password: string | null;
  id: number;
  telegramId: string;
  authorizationStatus: 0 | 1 | 2;
  groups: Array<{
    id: number;
    name: string;
  }>
}

export const load: PageServerLoad = async ({ fetch, url }) => {
  const users = await fetch(new URL(paginate(url, '/users'), server_base))
    .then(unwrapResult) as { count: number; data: UserData[] };

  return {
    users
  }
};