import type { RequestHandler } from "./$types";
import { errorToResponse, unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";

export const GET: RequestHandler = async ({ fetch, url }) => {
  const targetUrl = serverUrl('/groups/search');
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