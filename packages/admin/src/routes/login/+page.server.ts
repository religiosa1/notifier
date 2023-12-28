import { base } from "$app/paths";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { handleActionFailure, unwrapResult } from "~/helpers/unwrapResult";
import { hasField } from "~/helpers/hasField";
import { serverUrl } from "~/helpers/serverUrl";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(307, base + '/');
  }
}

export const actions: Actions = {
  async default({ fetch, request, url, cookies }) {
    const formData = await request.formData();
    const name = formData.get("name");
    const password = formData.get("password");
    let serverData;
    try {
      serverData = await fetch(serverUrl("/login"), {
        method: "POST",
        body: JSON.stringify({ name, password }),
      }).then(unwrapResult);
    } catch (e) {
      console.error("Login error", e);
      return handleActionFailure(e, { name });
    }
    if (!hasField(serverData, "token", "string")) {
      return fail(500, { error: "Bad server response, missing `token` field.", name });
    }
    cookies.set("Authorization", `Bearer ${serverData.token}`, { path: '/' });
    const referer = url.searchParams.get("referer");
    await redirect(307, referer ? base + referer : "/");
  }
};