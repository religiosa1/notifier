import type { Actions, PageServerLoad } from "./$types";
import { unwrapResult, handleActionFailure, handleLoadError } from "~/helpers/unwrapResult";
import { channelNameSchema, type Channel } from "@shared/models/Channel";
import { serverUrl } from "~/helpers/serverUrl";

export const load: PageServerLoad = async ({ fetch }) => {
	const channels = await fetch(serverUrl("/channels/search"))
		.then(unwrapResult<Channel[]>)
		.catch(handleLoadError);

	return {
		channels,
	}
};

export const actions: Actions = {
	async send({ fetch, request }) {
		const formData = await request.formData();
		const message = formData.get("message")?.toString();
		const channels = formData.get("channels")?.toString()
			?.split(/(?:\s*,\s*)|(?:\s+)/)
			.map(i => channelNameSchema.parse(i.trim(), { path: ["channels", "i"] }));
		try {
			await fetch(serverUrl("/notify"), {
				method: "POST",
				body: JSON.stringify({ channels, message }),
			}).then(unwrapResult);
			return { success: true }
		} catch (err) {
			return handleActionFailure(err, { message, channels: channels?.join(", ") });
		}
	}
}