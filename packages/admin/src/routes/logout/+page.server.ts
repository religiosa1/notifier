import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";
import type { Actions } from "./$types";

export const actions: Actions = {
  async default({ cookies }) {
    cookies.delete("Authorization", { path: "/" });
    redirect(302, base + "/login");
  }
};