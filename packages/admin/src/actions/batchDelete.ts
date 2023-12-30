import type { Action, RequestEvent } from "@sveltejs/kit";
import { unwrapResult } from "~/helpers/unwrapResult";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { serverUrl } from "~/helpers/serverUrl";
import { serverAction } from "./serverAction";

interface DeleteActionProps {
	route: string;
	method?: string;
}
export const batchDelete = <
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
>(propsGetter: DeleteActionProps | ((props: RequestEvent<Params>) => DeleteActionProps)) => (async (props) => {
		const { request, fetch } = props;
		const { route, method } = typeof propsGetter === "function"
			? propsGetter(props)
			: propsGetter;

		const [serverData, error] = await serverAction(async () => {
			const formData = await request.formData();
			const data = formData.getAll("id")
				.filter(i => typeof i === "string").join();
			const url = serverUrl(route);
			url.searchParams.set("id", data);
			return fetch(
				url,
				{
					method: method ?? "DELETE",
					body: JSON.stringify(data),
				}
			).then(unwrapResult<BatchOperationStats>);
		});
		if (error) {
			return error;
		}
		return serverData;
	}) satisfies Action<Params>;