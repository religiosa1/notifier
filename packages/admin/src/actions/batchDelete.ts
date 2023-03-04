import type { Action } from "@sveltejs/kit";
import { unwrapServerError, unwrapResult } from "~/helpers/unwrapResult";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { server_base } from "~/constants";

interface DeleteActionProps {
  route: string
}
export const batchDelete = ({ route }: DeleteActionProps) =>
  (async ({ request, fetch }) => {
    const formData = await request.formData();
    const data = formData.getAll("id")
      .filter(i => typeof i === "string").join();
    try {
      const url = new URL(route, server_base);
      url.searchParams.set("id", data)
      const serverData = await fetch(
        url,
        {
          method: "DELETE",
          body: JSON.stringify(data),
        }
      ).then(unwrapResult) as BatchOperationStats;
      return serverData;
    } catch(err) {
      console.error("ERRORED", err);
      return unwrapServerError(err);
    }
  }) satisfies Action;