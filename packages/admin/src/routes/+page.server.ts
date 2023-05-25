import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { uri } from "~/helpers/uri";

export const load: PageServerLoad = async ({ url, cookies }) => {
  if (!cookies.get("Authorization")) {
    throw redirect(303, uri`/login?referrer=${url.pathname}`)
  }
};