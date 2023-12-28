import type { Action, RequestEvent } from "@sveltejs/kit";
import { handleActionFailure, unwrapResult } from "~/helpers/unwrapResult";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { serverUrl } from "~/helpers/serverUrl";

interface DeleteActionProps {
	route: string;
	method?: string;
}
export const batchDelete = <
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
>(propsGetter: DeleteActionProps | ((props: RequestEvent<Params>) => DeleteActionProps)) => (async (props) => {
		const { route, method } = typeof propsGetter === "function"
			? propsGetter(props)
			: propsGetter;

		const { request, fetch } = props;
		const formData = await request.formData();
		const data = formData.getAll("id")
			.filter(i => typeof i === "string").join();
		try {
			const url = serverUrl(route);
			url.searchParams.set("id", data)
			const serverData = await fetch(
				url,
				{
					method: method ?? "DELETE",
					body: JSON.stringify(data),
				}
			).then(unwrapResult) as BatchOperationStats;
			return serverData;
		} catch(err) {
			console.error("Batch delete error", err);
			return handleActionFailure(err);
		}
	}) satisfies Action<Params>;