import type { Actions, PageServerLoad } from './$types';
import { server_base } from '~/constants';
import { unwrapServerError, unwrapResult, unwrapValidationError } from '~/helpers/unwrapResult';
import { uri } from '~/helpers/uri';
import { passwordSchema, userUpdateSchema, type UserDetail } from "@shared/models/User";
import { getFormData } from '~/helpers/getFormData';

export const load: PageServerLoad = async ({ fetch, params }) => {
  try {
    var user = await fetch(new URL(uri`/users/${params.id}`, server_base))
      .then(unwrapResult) as UserDetail;
  } catch (err) {
    console.error("ERRORED", err);
    return unwrapServerError(err);
  }

  return {
    user
  };
};

export const actions: Actions = {
  async edit({ fetch, request, params }) {
    const formData = await request.formData();
    try {
      var data = getFormData(formData, userUpdateSchema, {
        password: () => undefined,
      });
    } catch (e) {
      return unwrapValidationError(e, Object.fromEntries(formData));
    }
    try {
      const serverData = (await fetch(new URL(uri`/users/${params.id}`, server_base), {
        method: "POST",
        body: JSON.stringify(data),
      }).then(unwrapResult)) as UserDetail;
      return {
        user: serverData
      }
    } catch (err) {
      console.error("User update error", err);
      return unwrapServerError(err, data!);
    }
  },
  async resetPassword({ fetch, request, params }) {
    const formData = await request.formData();
    try {
      var password = passwordSchema.parse(formData.get("password") || null);
    } catch (e) {
      return unwrapValidationError(e, Object.fromEntries(formData));
    }
    try {
      const serverData = (await fetch(new URL(uri`/users/${params.id}`, server_base), {
        method: "POST",
        body: JSON.stringify({ password }),
      }).then(unwrapResult)) as UserDetail;
      return {
        user: serverData
      }
    } catch (err) {
      console.error("User update error", err);
      return unwrapServerError(err);
    }
  },
}