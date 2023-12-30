import type { Actions, PageServerLoad } from "./$types";
import { channelNameSchema, type Channel } from "@shared/models/Channel";
import { unwrapResult } from "~/helpers/unwrapResult";
import { serverUrl } from "~/helpers/serverUrl";
import { serverAction } from "~/actions/serverAction";

export const load: PageServerLoad = async ({ fetch }) => {
	const channels = await fetch(serverUrl("/channels/search"))
		.then(unwrapResult<Channel[]>);

	return {
		channels,
	}
};

export const actions: Actions = {
	async default({ fetch, request }) {
		const [data, error] = await serverAction(async () => {
			const formData = await request.formData();
			const message = formData.get("chatmessage")?.toString();
			const channels = formData.get("channels")?.toString()
				?.split(/(?:\s*,\s*)|(?:\s+)/)
				.map(i => channelNameSchema.parse(i.trim(), { path: ["channels", "i"] }));
			return  fetch(serverUrl("/notify"), {
				method: "POST",
				body: JSON.stringify({ channels, message }),
			}).then(unwrapResult);
		});
		return error ?? data;
	}
}