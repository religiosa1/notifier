import type { Actions } from './$types';
import { server_base } from '~/constants';
import { unwrapResult, unwrapServerError, unwrapValidationError } from '~/helpers/unwrapResult';
import { uri } from '~/helpers/uri';
import { userCreateSchema, type UserDetail } from "@shared/models/User";
import { attempt } from "@shared/helpers/attempt";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import { getFormData } from '~/helpers/getFormData';

export const actions: Actions = {
  async create({ request, fetch }) {
    const formData = await request.formData();
    let serverData;
    const [ data, valErr ] = attempt(() => getFormData(formData, userCreateSchema));
    if (valErr != null) {
      return unwrapValidationError(valErr, Object.fromEntries(formData));
    }
    try {
      serverData = await fetch(new URL("/users", server_base), {
        method: "PUT",
        body: JSON.stringify(data),
      }).then(unwrapResult) as UserDetail;
    } catch(err) {
      console.error("ERRORED", err);
      return unwrapServerError(err, data!);
    }
    throw redirect(303, base + uri`/users/${serverData.id}`);
  }
}