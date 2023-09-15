import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { uri } from "~/helpers/uri";
import { serverUrl } from "~/helpers/serverUrl";

export const load: PageServerLoad = async ({ url, cookies }) => {
  if (!cookies.get("Authorization")) {
    // TODO: check if we even need this stuff, we already checking that in layout

    // We check that settings exist for the potential first launch here.
    // as user without a valid auth cookie will be redirected here anyway.
    const hasServerSettings = await fetch(serverUrl("/settings")).then(r => r.ok);

    if (!hasServerSettings) {
      throw redirect(303, "/settings");
    }
    throw redirect(303, uri`/login?referrer=${url.pathname}`)
  }
};