import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { unwrapError, unwrapResult } from "~/helpers/unwrapResult";
import { server_base } from "~/constants";

export const actions: Actions = {
  default: async ({ fetch, request, url, cookies }) => {
    const data = await request.formData();
    const name = data.get("name");
    const password = data.get("password");
    let serverData;
    console.log({ name, password });
    try {
      serverData = await fetch(new URL("/login", server_base), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, password }),
      }).then(unwrapResult);
    } catch (e) {
      console.error("ERRORED", e);
      return unwrapError(e, { name });
    }

    if (!serverData || typeof serverData !== "object" || !("token" in  serverData)) {
      throw fail(500, { error: "Bad server response, missing `token` field." });
    }
    cookies.set("Authorization", `Bearer ${serverData.token}`);
    throw redirect(303, url.searchParams.get("referer") || "/");
  }
};