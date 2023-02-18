import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { base } from "$app/paths";

export const actions: Actions = {
  async default({ cookies }) {
    cookies.delete("Authorization");
    throw redirect(303, base + "/login");
  }
};