import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { handleActionFailure, unwrapResult } from "~/helpers/unwrapResult";
import { server_base } from "~/constants";
import { hasField } from "~/helpers/hasField";

export const actions: Actions = {
  async default({ fetch, request, url, cookies }) {
    const formData = await request.formData();
    const name = formData.get("name");
    const password = formData.get("password");
    let serverData;
    try {
      serverData = await fetch(new URL("/login", server_base), {
        method: "POST",
        body: JSON.stringify({ name, password }),
      }).then(unwrapResult);
    } catch (e) {
      console.error("ERRORED", e);
      return handleActionFailure(e, { name });
    }

    if (!hasField(serverData, "token", "string")) {
      throw fail(500, { error: "Bad server response, missing `token` field." });
    }
    cookies.set("Authorization", `Bearer ${serverData.token}`);
    throw redirect(303, url.searchParams.get("referer") || "/");
  }
};