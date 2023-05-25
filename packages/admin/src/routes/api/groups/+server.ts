import { server_base } from "~/constants";
import { errorToResponse, unwrapResult } from "~/helpers/unwrapResult";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch, url }) => {
  const targetUrl = new URL('/groups/search', server_base);
  const name = url.searchParams.get("name");
  if (name) {
    targetUrl.searchParams.set("name", name)
  }
  try {
    var groups = await fetch(targetUrl)
      .then(unwrapResult);
  } catch(e) {
    return errorToResponse(e);
  }

  return new Response(JSON.stringify(groups));
};